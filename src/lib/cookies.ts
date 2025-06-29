'use client';

/**
 * Sets a cookie in the browser.
 * @param name The name of the cookie.
 * @param value The value to store.
 * @param days The number of days until the cookie expires.
 */
export function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // Use encodeURIComponent to ensure the value is properly stored
  document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/";
}

/**
 * Gets a cookie from the browser.
 * @param name The name of the cookie to retrieve.
 * @returns The value of the cookie, or null if not found.
 */
export function getCookie(name: string): string | null {
  // Can't get cookies on the server
  if (typeof document === 'undefined') {
    return null;
  }
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      // Use decodeURIComponent to get the original value
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}
