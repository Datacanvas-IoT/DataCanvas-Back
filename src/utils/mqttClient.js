const mqtt = require('mqtt');
const mqttDataGatheringController = require('../controllers/mqttDataGatheringController');

// const client = mqtt.connect('mqtt://192.248.11.35:1883');
const client = mqtt.connect('mqtts://broker.emqx.io:8883', 'mqttx_790fvffdfd0c455', { username: 'emqx' });
client.on('connect', () => {
  client.subscribe('project/+/data', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic:', err);
    } else {
      console.log('Subscribed to topic: project/+/data');
    }
  });

  client.subscribe('projectSuccess/+/data/', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic:', err);
    } else {
      console.log('Subscribed to topic: projectSuccess/+/data/');
    }
  });
});


client.on('message', async (topic, message) => {
  console.log(`Received message from ${topic}: ${message.toString()}`);

  const tokens = topic.split('/');
  const projectID = tokens[1];
  const topicType = tokens[0];

  if (topicType === 'projectSuccess') return console.log('Received message from projectSuccess');

  const data = JSON.parse(message.toString());

  const requestData = {
    project_id: projectID,
    mqtt_key: data.mqttKey,
    fingerprint: data.deviceID,
    table: data.table,
    data: data.data
  };

  try {
    if (validateFields(requestData)) {
      const result = await mqttDataGatheringController.insertData(requestData);

      console.log('Result:', result);
      if (result && result.message == 'Data inserted successfully') {
        publish(`projectSuccess/${projectID}/data/`,
          // Publish request data
          JSON.stringify(
            result.data
          )
        );
      }
    } else {
      console.error('Validation failed', requestData);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

function publish(topic, message) {
  console.log(`Publishing to ${topic}: ${message}`);
  client.publish(topic, message);
}

// check if all required fields are present
function validateFields(data) {
  const { project_id, mqtt_key, fingerprint, table, data: payload } = data;
  return project_id && fingerprint && table && payload;
}

module.exports = client;
