/**
 * Calculate password strength
 */
export function getPasswordStrength(password: string, COLORS: any): {
  label: string;
  percentage: number;
  color: string;
} {
  if (!password) {
    return { label: '', percentage: 0, color: COLORS.outline };
  }

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 2) {
    return { label: 'Yếu', percentage: 33, color: COLORS.error };
  } else if (strength <= 4) {
    return { label: 'Vừa phải', percentage: 66, color: '#f59e0b' };
  } else {
    return { label: 'Mạnh', percentage: 100, color: COLORS.emerald };
  }
}
