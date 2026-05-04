const axios = require('axios');

const LOGS_API = 'http://20.207.122.201/evaluation-service/logs';
let config = null;

async function Log(stack, level, pkg, message) {
  if (!['backend', 'frontend'].includes(stack)) throw new Error('Invalid stack: backend or frontend');
  if (!['debug','info','warn','error','fatal'].includes(level)) throw new Error('Invalid level');
  
  const validPkgs = {
    backend: ['cache','controller','cron_job','db','domain','handler','repository','route','service','auth','config','middleware','utils'],
    frontend: ['api','component','hook','page','state','style','auth','config','middleware','utils']
  };
  if (!validPkgs[stack].includes(pkg)) throw new Error('Invalid package for stack');

  if (!config) {
    config = require('../notification_app_be/config.js');  // Adjust path when renaming
  }

  try {
    const response = await axios.post(LOGS_API, {
      stack,
      level,
      package: pkg,
      message: message.toString()
    }, {
      headers: {
        Authorization: `${config.token_type} ${config.access_token}`
      },
      timeout: 5000
    });
    return response.data.logID;
  } catch (err) {
    console.error('Log API failed:', err.message);
  }
}

module.exports = { Log };
