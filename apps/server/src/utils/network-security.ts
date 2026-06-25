import dns from 'node:dns/promises';
import net from 'node:net';

function isLoopbackHostname(hostname: string): boolean {
    const value = hostname.toLowerCase();
    return value === 'localhost' || value === 'localhost.';
}

function isPrivateIpv4(ip: string): boolean {
    const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
        return false;
    }

    const [a, b] = parts;

    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;

    return false;
}

function isPrivateIpv6(ip: string): boolean {
    const value = ip.toLowerCase();
    if (value === '::1') return true;
    if (value.startsWith('fe80:')) return true; // link-local
    if (value.startsWith('fc') || value.startsWith('fd')) return true; // ULA
    if (value.startsWith('::ffff:127.')) return true;
    return false;
}

function isPublicIp(ip: string): boolean {
    const family = net.isIP(ip);
    if (family === 4) {
        return !isPrivateIpv4(ip);
    }
    if (family === 6) {
        return !isPrivateIpv6(ip);
    }
    return false;
}

export async function isSafePublicHttpUrl(value: string): Promise<boolean> {
    let parsed: URL;

    try {
        parsed = new URL(value);
    } catch {
        return false;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
    }

    if (parsed.username || parsed.password) {
        return false;
    }

    if (isLoopbackHostname(parsed.hostname)) {
        return false;
    }

    const port = parsed.port ? Number.parseInt(parsed.port, 10) : undefined;
    if (port !== undefined && (Number.isNaN(port) || port <= 0 || port > 65535)) {
        return false;
    }

    // Block local-network IP literals directly.
    if (net.isIP(parsed.hostname) > 0) {
        return isPublicIp(parsed.hostname);
    }

    // Resolve DNS and ensure all resolved addresses are public.
    let addresses: dns.LookupAddress[] = [];
    try {
        addresses = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
    } catch {
        return false;
    }

    if (!addresses.length) {
        return false;
    }

    return addresses.every((entry) => isPublicIp(entry.address));
}
