// Parse user agent string to extract browser, OS, and device info

export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  }

  // Parse browser (order matters - check specific browsers before generic ones)
  let browser = 'Unknown';
  if (userAgent.includes('Brave')) {
    browser = 'Brave';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) {
    browser = 'Opera';
  } else if (userAgent.includes('Vivaldi')) {
    browser = 'Vivaldi';
  } else if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Chromium')) {
    browser = 'Chromium';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
    browser = 'Internet Explorer';
  }

  // Parse OS
  let os = 'Unknown';
  if (userAgent.includes('Windows NT 10')) {
    os = 'Windows 10/11';
  } else if (userAgent.includes('Windows NT')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('iPhone')) {
    os = 'iOS';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('CrOS')) {
    os = 'Chrome OS';
  }

  // Parse device type
  let device = 'Desktop';
  if (userAgent.includes('Mobile') || userAgent.includes('iPhone')) {
    device = 'Mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}
