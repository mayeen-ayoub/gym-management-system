const prompt = require('prompt-sync')();

class Admin {	
  constructor(client) {
    this.client = client;
  }

  async #checkIfAdmin() {
    try {
      const email = prompt("Enter admin email: ");
      const password = prompt("Enter password: ");
      const dbPasswordResult = await this.client.query('SELECT id, password FROM Admin WHERE email = $1;', [email]);
      const dbPassword = dbPasswordResult?.rows[0]?.password;

      if (dbPasswordResult?.rowCount === 0 || password !== dbPassword) {
        console.log(`Incorrect user or password. Terminating...`);
        return null;
      }
      return dbPasswordResult.rows[0].id;
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return null;
    }
  }

  async bookRoom() {
    try {
      const adminId = await this.#checkIfAdmin();
      if (adminId !== null) {
        const roomNumber = prompt("Which room would you like to book? ");
        const eventType = prompt("What kind of event are you booking the room for (group session, birthday party, etc.)? ");
        const date = prompt("What date are you booking the room for (yyyy-mm-dd)? ");
        const startTime = prompt("What time does the event start (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");
        const endTime = prompt("What time does the event end (eg. type 1:30 for 1:30am and 13:30 for 1:30pm)? ");

        const insertQuery = `
            INSERT INTO Room_Booking (room_number, event_type, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5);
        `;
        await this.client.query(insertQuery, [roomNumber, eventType, date, startTime, endTime]);
        console.log("The room booking has been saved.");
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }
}
module.exports = Admin;
