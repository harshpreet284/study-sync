process.env.NODE_ENV = 'test';

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables explicitly
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { app, resolveAllowedOrigins, isOriginAllowed } = await import('../server.js');

console.log('='.repeat(60));
console.log('StudySync Backend CORS Security Integration Test Suite');
console.log('='.repeat(60));

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED (Assertion ${totalTests}): ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`✓ PASSED [${totalTests}]: ${message}`);
  }
}

const runCorsTests = async () => {
  // -------------------------------------------------------------------------
  // Suite 1: resolveAllowedOrigins Unit Tests
  // -------------------------------------------------------------------------
  console.log('\n[Suite 1: resolveAllowedOrigins Normalization Unit Tests]');
  {
    // Default origins when unset or blank in development/test
    const defaults = resolveAllowedOrigins(undefined);
    assert(
      defaults.includes('http://localhost:5173') && defaults.includes('http://127.0.0.1:5173'),
      'Default origins include localhost:5173 and 127.0.0.1:5173 when env is undefined'
    );
    assert(defaults.length === 2, 'Default origins array contains exactly 2 items');

    const empty = resolveAllowedOrigins('');
    assert(empty.length === 2, 'Empty string returns default origins in test/dev');

    const whitespaceOnly = resolveAllowedOrigins('   ');
    assert(whitespaceOnly.length === 2, 'Whitespace-only string returns default origins in test/dev');

    // Environment-specific localhost inclusion: development, test, and undefined
    const devOrigins = resolveAllowedOrigins('', 'development');
    assert(
      devOrigins.includes('http://localhost:5173') && devOrigins.includes('http://127.0.0.1:5173') && devOrigins.length === 2,
      'Development environment retains localhost defaults'
    );

    const testOrigins = resolveAllowedOrigins('', 'test');
    assert(
      testOrigins.includes('http://localhost:5173') && testOrigins.includes('http://127.0.0.1:5173') && testOrigins.length === 2,
      'Test environment retains localhost defaults'
    );

    const unspecifiedEnvOrigins = resolveAllowedOrigins('', undefined);
    assert(
      unspecifiedEnvOrigins.includes('http://localhost:5173') && unspecifiedEnvOrigins.length === 2,
      'Unspecified NODE_ENV defaults to allowing localhost'
    );

    // Production environment: localhost defaults are excluded
    const prodEmpty = resolveAllowedOrigins('', 'production');
    assert(prodEmpty.length === 0, 'Production environment returns empty allowlist when CLIENT_URL is empty');

    const prodNull = resolveAllowedOrigins(null, 'production');
    assert(prodNull.length === 0, 'Production environment returns empty allowlist when CLIENT_URL is null');

    const prodBlank = resolveAllowedOrigins('   ', 'production');
    assert(prodBlank.length === 0, 'Production environment returns empty allowlist for whitespace CLIENT_URL');

    // Test unset process.env.CLIENT_URL handling
    const savedUrlEnv = process.env.CLIENT_URL;
    delete process.env.CLIENT_URL;
    const prodUnsetEnv = resolveAllowedOrigins(undefined, 'production');
    assert(prodUnsetEnv.length === 0, 'Production environment excludes localhost defaults when CLIENT_URL is undefined');
    const devUnsetEnv = resolveAllowedOrigins(undefined, 'development');
    assert(devUnsetEnv.length === 2, 'Development environment includes localhost defaults when CLIENT_URL is undefined');
    process.env.CLIENT_URL = savedUrlEnv;

    const prodConfigured = resolveAllowedOrigins('https://studysync.vercel.app/', 'production');
    assert(
      prodConfigured.includes('https://studysync.vercel.app') && prodConfigured.length === 1,
      'Production environment only includes explicitly configured CLIENT_URL origins'
    );
    assert(
      !prodConfigured.includes('http://localhost:5173') && !prodConfigured.includes('http://127.0.0.1:5173'),
      'Production environment does not automatically append localhost origins'
    );

    const prodExplicitLocalhost = resolveAllowedOrigins('http://localhost:5173', 'production');
    assert(
      prodExplicitLocalhost.includes('http://localhost:5173') && prodExplicitLocalhost.length === 1,
      'Production allows localhost only if explicitly configured in CLIENT_URL'
    );

    // Single origin with trailing slash
    const singleSlash = resolveAllowedOrigins('https://studysync.vercel.app/');
    assert(
      singleSlash.includes('https://studysync.vercel.app'),
      'Single origin trailing slash is stripped'
    );
    assert(
      !singleSlash.includes('https://studysync.vercel.app/'),
      'Single origin trailing slash string is not retained'
    );

    // Single origin with multiple trailing slashes and whitespace
    const multiSlash = resolveAllowedOrigins('  https://studysync.vercel.app///  ');
    assert(
      multiSlash.includes('https://studysync.vercel.app'),
      'Multiple trailing slashes and padding whitespace are stripped'
    );

    // Multiple comma-separated origins
    const multi = resolveAllowedOrigins(
      'https://app.studysync.com/, https://admin.studysync.com,  https://preview.studysync.com/  '
    );
    assert(
      multi.includes('https://app.studysync.com') &&
      multi.includes('https://admin.studysync.com') &&
      multi.includes('https://preview.studysync.com'),
      'Comma-separated origins are parsed and normalized individually'
    );
    assert(
      multi.includes('http://localhost:5173') && multi.includes('http://127.0.0.1:5173'),
      'Default localhost origins are preserved alongside configured origins'
    );
    assert(multi.length === 5, 'Contains exactly 3 configured + 2 default origins');

    // Comma-separated with empty segments
    const emptySegments = resolveAllowedOrigins('https://app.com, , ,, https://other.com/');
    assert(
      emptySegments.includes('https://app.com') && emptySegments.includes('https://other.com'),
      'Empty segments between commas are safely discarded'
    );
    assert(emptySegments.length === 4, 'Empty segments do not create blank allowed origins');

    // Duplicate configured origin matches default origin
    const dupe = resolveAllowedOrigins('http://localhost:5173/');
    assert(dupe.length === 2, 'Configured duplicate of default origin is deduplicated');
  }

  // -------------------------------------------------------------------------
  // Suite 2: isOriginAllowed Helper Unit Tests
  // -------------------------------------------------------------------------
  console.log('\n[Suite 2: isOriginAllowed Helper Unit Tests]');
  {
    const allowed = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://studysync.io'];

    // Missing origin (server-to-server, cURL, health checks)
    assert(isOriginAllowed(undefined, allowed) === true, 'Undefined origin returns true');
    assert(isOriginAllowed(null, allowed) === true, 'Null origin returns true');
    assert(isOriginAllowed('', allowed) === true, 'Empty origin returns true');

    // Matching allowed origin
    assert(isOriginAllowed('http://localhost:5173', allowed) === true, 'Exact matching origin returns true');
    assert(isOriginAllowed('https://studysync.io', allowed) === true, 'Configured production origin returns true');

    // Incoming origin with trailing slash or whitespace
    assert(isOriginAllowed('https://studysync.io/', allowed) === true, 'Incoming origin with trailing slash is permitted');
    assert(isOriginAllowed('  https://studysync.io  ', allowed) === true, 'Incoming origin with whitespace is permitted');

    // Unauthorized origins
    assert(isOriginAllowed('https://attacker.com', allowed) === false, 'Untrusted origin is rejected');
    assert(isOriginAllowed('http://localhost:3000', allowed) === false, 'Non-allowed port is rejected');
    assert(isOriginAllowed('https://studysync.io.attacker.com', allowed) === false, 'Subdomain spoofing attempt is rejected');
    assert(isOriginAllowed('http://localhost:5173.attacker.com', allowed) === false, 'Localhost prefix spoofing attempt is rejected');
  }

  // -------------------------------------------------------------------------
  // Suite 3: HTTP Server CORS Preflight & Request Integration Tests
  // -------------------------------------------------------------------------
  console.log('\n[Suite 3: HTTP Server Preflight & Request Integration Tests]');

  // Spin up ephemeral server on open random port
  const server = app.listen(0);
  const port = server.address().port;
  const healthUrl = `http://127.0.0.1:${port}/api/health`;

  const originalClientUrl = process.env.CLIENT_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  try {
    // 1. Request with no Origin header (health check, non-browser)
    const noOriginRes = await fetch(healthUrl);
    assert(noOriginRes.status === 200, 'Request with no Origin header returns 200 OK');
    const noOriginBody = await noOriginRes.json();
    assert(noOriginBody.success === true, 'No-origin response has success: true');
    assert(
      noOriginRes.headers.get('access-control-allow-origin') === null,
      'No-origin response does not set Access-Control-Allow-Origin header'
    );

    // 2. Request from default allowed localhost origin
    const localRes = await fetch(healthUrl, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert(localRes.status === 200, 'Request from http://localhost:5173 returns 200 OK');
    assert(
      localRes.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      'Access-Control-Allow-Origin echoes back http://localhost:5173'
    );
    assert(
      localRes.headers.get('access-control-allow-credentials') === 'true',
      'Access-Control-Allow-Credentials is true for allowed origin'
    );

    // 3. Request from default 127.0.0.1 origin
    const ipRes = await fetch(healthUrl, {
      headers: { Origin: 'http://127.0.0.1:5173' },
    });
    assert(ipRes.status === 200, 'Request from http://127.0.0.1:5173 returns 200 OK');
    assert(
      ipRes.headers.get('access-control-allow-origin') === 'http://127.0.0.1:5173',
      'Access-Control-Allow-Origin echoes back http://127.0.0.1:5173'
    );

    // 4. Preflight OPTIONS request from allowed origin
    const preflightRes = await fetch(healthUrl, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert(preflightRes.status === 204, 'OPTIONS preflight from allowed origin returns 204 No Content');
    assert(
      preflightRes.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      'Preflight response includes Access-Control-Allow-Origin'
    );

    // 5. Unauthorized origin request (rejected with HTTP 403)
    const unauthorizedRes = await fetch(healthUrl, {
      headers: { Origin: 'https://evil-unauthorized-site.com' },
    });
    assert(unauthorizedRes.status === 403, 'Request from unauthorized origin returns 403 Forbidden');
    const unauthorizedBody = await unauthorizedRes.json();
    assert(unauthorizedBody.success === false, 'Unauthorized response has success: false');
    assert(
      unauthorizedBody.message === 'Blocked by CORS policy',
      'Unauthorized error message indicates "Blocked by CORS policy"'
    );
    assert(
      unauthorizedRes.headers.get('access-control-allow-origin') === null,
      'Access-Control-Allow-Origin is not set on rejected response'
    );

    // 6. Preflight OPTIONS request from unauthorized origin (rejected with HTTP 403)
    const unauthorizedPreflight = await fetch(healthUrl, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil-unauthorized-site.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert(unauthorizedPreflight.status === 403, 'OPTIONS preflight from unauthorized origin returns 403 Forbidden');

    // 7. Dynamic CLIENT_URL with trailing slash and whitespace
    process.env.CLIENT_URL = 'https://custom-deploy.vercel.app/   ';
    const trailingSlashRes = await fetch(healthUrl, {
      headers: { Origin: 'https://custom-deploy.vercel.app' },
    });
    assert(
      trailingSlashRes.status === 200,
      'Request succeeds when CLIENT_URL was configured with trailing slash and whitespace'
    );
    assert(
      trailingSlashRes.headers.get('access-control-allow-origin') === 'https://custom-deploy.vercel.app',
      'Access-Control-Allow-Origin reflects normalized origin'
    );

    // 8. Dynamic CLIENT_URL with multiple comma-separated origins
    process.env.CLIENT_URL = 'https://prod.studysync.io/,  https://staging.studysync.io/  ';
    const prodRes = await fetch(healthUrl, {
      headers: { Origin: 'https://prod.studysync.io' },
    });
    assert(prodRes.status === 200, 'First origin in multi-origin CLIENT_URL succeeds with 200 OK');
    assert(
      prodRes.headers.get('access-control-allow-origin') === 'https://prod.studysync.io',
      'First origin receives proper Access-Control-Allow-Origin'
    );

    const stagingRes = await fetch(healthUrl, {
      headers: { Origin: 'https://staging.studysync.io' },
    });
    assert(stagingRes.status === 200, 'Second origin in multi-origin CLIENT_URL succeeds with 200 OK');
    assert(
      stagingRes.headers.get('access-control-allow-origin') === 'https://staging.studysync.io',
      'Second origin receives proper Access-Control-Allow-Origin'
    );

    // 9. Rejected third origin when multi-origin CLIENT_URL is set
    const thirdPartyRes = await fetch(healthUrl, {
      headers: { Origin: 'https://unrelated-third-party.com' },
    });
    assert(thirdPartyRes.status === 403, 'Unlisted origin is rejected when multi-origin CLIENT_URL is set');

    // 10. Production environment integration test: localhost rejected, explicit CLIENT_URL allowed
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://prod.studysync.io';

    const prodLocalRes = await fetch(healthUrl, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert(
      prodLocalRes.status === 403,
      'Production environment rejects localhost origin when not in CLIENT_URL'
    );

    const prodAllowedRes = await fetch(healthUrl, {
      headers: { Origin: 'https://prod.studysync.io' },
    });
    assert(
      prodAllowedRes.status === 200,
      'Production environment allows explicitly configured CLIENT_URL origin'
    );

    const prodNoOriginRes = await fetch(healthUrl);
    assert(
      prodNoOriginRes.status === 200,
      'Production environment still allows non-browser request without Origin header'
    );
  } finally {
    process.env.CLIENT_URL = originalClientUrl;
    process.env.NODE_ENV = originalNodeEnv;
    await new Promise((resolve) => server.close(resolve));
    console.log('✓ Closed ephemeral test server cleanly.');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`CORS Security Test Summary: ${passedTests}/${totalTests} assertions passed.`);
  console.log('='.repeat(60));
  console.log('✓ All CORS normalization, allowlist, and preflight security tests passed successfully.');
};

runCorsTests().catch((err) => {
  console.error('\n❌ Unhandled error in CORS test suite:', err);
  process.exit(1);
});
