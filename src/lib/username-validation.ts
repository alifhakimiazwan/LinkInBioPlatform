import { prisma } from './prisma';

// Username validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'api', 'app', 'www', 'mail', 'ftp', 'blog', 'store', 'shop',
  'dashboard', 'login', 'signup', 'auth', 'oauth', 'callback', 'settings',
  'profile', 'account', 'help', 'support', 'contact', 'about', 'terms',
  'privacy', 'legal', 'docs', 'documentation', 'status', 'health',
  'pricing', 'features', 'home', 'landing', 'welcome', 'onboarding',
  'billing', 'payment', 'checkout', 'success', 'error', 'notfound',
  '404', '500', 'maintenance', 'coming-soon', 'soon', 'beta', 'alpha',
  'dev', 'development', 'staging', 'test', 'testing', 'demo',
  'assets', 'static', 'public', 'media', 'uploads', 'downloads',
  'images', 'img', 'css', 'js', 'javascript', 'fonts', 'favicon',
  'robots', 'sitemap', 'manifest', 'security', 'well-known',
  // Add common social media usernames
  'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok',
  'github', 'discord', 'telegram', 'whatsapp', 'snapchat', 'pinterest',
  // Add other common reserved words
  'root', 'user', 'guest', 'anonymous', 'unknown', 'null', 'undefined',
  'true', 'false', 'yes', 'no', 'on', 'off', 'none', 'all', 'any',
];

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUsernameFormat(username: string): UsernameValidationResult {
  // Check length
  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters long`,
    };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Username must be no more than ${USERNAME_MAX_LENGTH} characters long`,
    };
  }

  // Check format (alphanumeric, hyphens, underscores only)
  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, hyphens, and underscores',
    };
  }

  // Check if starts or ends with special characters
  if (username.startsWith('-') || username.startsWith('_') || 
      username.endsWith('-') || username.endsWith('_')) {
    return {
      isValid: false,
      error: 'Username cannot start or end with hyphens or underscores',
    };
  }

  // Check for consecutive special characters
  if (username.includes('--') || username.includes('__') || 
      username.includes('-_') || username.includes('_-')) {
    return {
      isValid: false,
      error: 'Username cannot contain consecutive special characters',
    };
  }

  // Check reserved usernames (case insensitive)
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return {
      isValid: false,
      error: 'This username is reserved and cannot be used',
    };
  }

  return { isValid: true };
}

export async function checkUsernameAvailability(username: string, excludeUserId?: string): Promise<UsernameValidationResult> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== excludeUserId) {
      return {
        isValid: false,
        error: 'This username is already taken',
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return {
      isValid: false,
      error: 'Unable to check username availability',
    };
  }
}

export async function validateUsername(username: string, excludeUserId?: string): Promise<UsernameValidationResult> {
  // First check format
  const formatResult = validateUsernameFormat(username);
  if (!formatResult.isValid) {
    return formatResult;
  }

  // Then check availability
  const availabilityResult = await checkUsernameAvailability(username, excludeUserId);
  if (!availabilityResult.isValid) {
    return availabilityResult;
  }

  return { isValid: true };
}

export function generateUsernameFromEmail(email: string): string {
  const baseUsername = email.split('@')[0];
  // Remove any invalid characters and convert to lowercase
  let cleanUsername = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Ensure minimum length
  if (cleanUsername.length < USERNAME_MIN_LENGTH) {
    cleanUsername += Math.random().toString(36).substring(2, USERNAME_MIN_LENGTH - cleanUsername.length + 2);
  }
  
  // Ensure maximum length
  if (cleanUsername.length > USERNAME_MAX_LENGTH) {
    cleanUsername = cleanUsername.substring(0, USERNAME_MAX_LENGTH);
  }
  
  return cleanUsername;
}

export async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;
  
  while (!(await checkUsernameAvailability(username)).isValid) {
    username = `${baseUsername}${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 1000) {
      username = `${baseUsername}${Date.now()}`;
      break;
    }
  }
  
  return username;
}