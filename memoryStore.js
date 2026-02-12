// memoryStore.js

const users = [];
const logs = [];

function addLog(message) {
  if (logs.length >= 10) logs.shift();
  logs.push({
    message,
    createdAt: new Date()
  });
}

function addUser(user) {
  users.push({
    ...user,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

function getUsers() {
  return users;
}

function getLogs() {
  return logs;
}

module.exports = { addUser, addLog, getUsers, getLogs };
