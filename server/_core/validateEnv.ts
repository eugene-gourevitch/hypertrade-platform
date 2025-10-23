/**
 * Environment variable validation
 * Ensures all required environment variables are set on startup
 */

interface RequiredEnvVars {
  DATABASE_URL?: string;
  ANTHROPIC_API_KEY?: string;
  HYPERLIQUID_ACCOUNT_ADDRESS?: string;
  HYPERLIQUID_API_SECRET?: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  RESEND_API_KEY?: string;
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates that required environment variables are set
 * @returns Validation result with missing variables
 */
export function validateEnvironmentVariables(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    warnings: [],
  };

  const isProduction = process.env.NODE_ENV === 'production';
  const isCloudRun = process.env.K_SERVICE !== undefined;

  // Critical variables that will cause immediate failures
  const criticalVars = [
    'DATABASE_URL',
  ];

  // Add production-specific critical variables
  if (isProduction || isCloudRun) {
    criticalVars.push('HYPERLIQUID_ACCOUNT_ADDRESS');
    criticalVars.push('HYPERLIQUID_API_SECRET');
  }

  // Important variables that enable key features
  const importantVars = [
    'ANTHROPIC_API_KEY',
  ];

  // Optional but recommended variables
  const optionalVars = [
    'TELEGRAM_BOT_TOKEN',
    'RESEND_API_KEY',
    'BUILT_IN_FORGE_API_URL',
    'BUILT_IN_FORGE_API_KEY',
    'WALLETCONNECT_PROJECT_ID',
  ];

  // Check critical variables
  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      result.missing.push(varName);
      result.valid = false;
      console.error(`[ENV] ❌ Critical variable missing: ${varName}`);
    }
  }

  // Check important variables
  for (const varName of importantVars) {
    if (!process.env[varName]) {
      result.warnings.push(varName);
      console.warn(`[ENV] ⚠️  Important variable missing: ${varName} - Some features will be disabled`);
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      console.info(`[ENV] ℹ️  Optional variable not set: ${varName}`);
    }
  }

  // Validate format of certain variables
  if (process.env.DATABASE_URL && !isValidDatabaseUrl(process.env.DATABASE_URL)) {
    result.valid = false;
    console.error('[ENV] ❌ DATABASE_URL format is invalid');
  }

  if (process.env.HYPERLIQUID_TESTNET && 
      process.env.HYPERLIQUID_TESTNET !== 'true' && 
      process.env.HYPERLIQUID_TESTNET !== 'false') {
    result.warnings.push('HYPERLIQUID_TESTNET should be "true" or "false"');
  }

  return result;
}

/**
 * Validates database URL format
 */
function isValidDatabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  } catch {
    return false;
  }
}

/**
 * Logs environment status on startup
 */
export function logEnvironmentStatus() {
  console.log('[ENV] Validating environment variables...');
  
  const validation = validateEnvironmentVariables();
  
  if (!validation.valid) {
    console.error('[ENV] ❌ Environment validation failed!');
    console.error('[ENV] Missing critical variables:', validation.missing.join(', '));
    console.error('[ENV] Please set the required environment variables and restart.');
    process.exit(1);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('[ENV] ⚠️  Some features may be limited due to missing variables');
  } else {
    console.log('[ENV] ✅ All environment variables configured correctly');
  }
  
  // Log current environment mode
  const isDev = process.env.NODE_ENV === 'development';
  const isTestnet = process.env.HYPERLIQUID_TESTNET === 'true';
  
  console.log(`[ENV] Mode: ${isDev ? 'Development' : 'Production'}`);
  console.log(`[ENV] Hyperliquid: ${isTestnet ? 'Testnet' : 'Mainnet'}`);
}
