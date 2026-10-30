const localtunnel = require('localtunnel');
const server = require('./server');

const PORT = process.env.PORT || 5050;

async function start() {
  try {
    console.log('[Tunnel] Starting localtunnel for port', PORT, '...');
    const tunnel = await localtunnel({ port: PORT });

    console.log('\n============================================================');
    console.log('🚀 TUNNEL READY FOR GITHUB ACTIONS CI');
    console.log(`Public Tunnel URL: ${tunnel.url}`);
    console.log(`CI Report Endpoint: ${tunnel.url}/report`);
    console.log('------------------------------------------------------------');
    console.log('Action needed:');
    console.log(`Set GitHub Secret or Environment Variable RECEIVER_URL:`);
    console.log(`RECEIVER_URL=${tunnel.url}/report`);
    console.log('============================================================\n');

    tunnel.on('close', () => {
      console.log('[Tunnel] Tunnel closed.');
    });

    tunnel.on('error', (err) => {
      console.error('[Tunnel] Tunnel error:', err.message);
    });

    // Keep process alive
    process.on('SIGINT', () => {
      tunnel.close();
      server.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('[Tunnel] Failed to establish localtunnel:', err.message);
    console.log('\nAlternative: You can use Cloudflare Tunnel or ngrok:');
    console.log(`  npx cloudflared tunnel --url http://localhost:${PORT}`);
    console.log(`  ngrok http ${PORT}`);
    console.log(`Then set RECEIVER_URL=<assigned_tunnel_url>/report in GitHub Repository Secrets.\n`);
  }
}

start();
