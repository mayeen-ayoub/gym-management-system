const prompt = require('prompt-sync')();
const Table = require('cli-table');

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

  async manageEquipment() {
    try {
      const adminId = await this.#checkIfAdmin();
      if (adminId !== null) {
        console.log('How do you want modify the equipment?');
        console.log('1. Add a new machine');
        console.log('2. Update a current machine');
        console.log('3. Delete a machine');
        console.log('4. View machines');
        const selection = parseInt(prompt('Type the corresponding number to make a selection: '));
        
        switch (selection) {
          case 1:
            await this.#addEquipment();
            break;
          case 2:
            await this.#updateEquipment();
            break;
          case 3:
            await this.#deleteEquipment()
            break;
          default:
            await this.#viewEquipment();
        }
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #viewEquipment() {
    try {
      const allEquipment = await this.client.query('SELECT * FROM Equipment;');
      const headers = ['id', 'Need Maintenance?', 'Last Maintained On'];
      this.#printResultsAsTable(allEquipment, headers, true);
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  #printResultsAsTable(result, headers = [], isDateModify = false) {
    const table = new Table({
      head: headers,
    });

    result.rows.forEach(row => {
      if (isDateModify) {
        row = {
          ...row,
          last_maintained: row.last_maintained.toLocaleDateString('en-US'),
        }
      }
      table.push(Object.values(row));
    });

    console.log(table.toString());
  }

  async #addEquipment() {
    try {
      const needsMaintenanceInput = prompt("Does the machine need maintenance? Y/N: ").toLowerCase();
      const needsMaintenance = needsMaintenanceInput === "y" ? 'true' : 'false';
      const lastMaintained = prompt("When was the machine last maintained (yyyy-mm-dd)? ");

      const insertQuery = `
        INSERT INTO Equipment (needs_maintenance, last_maintained) VALUES ($1, $2);
      `;

      await this.client.query(insertQuery, [needsMaintenance, lastMaintained]);
      console.log("The machine has been added successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #updateEquipment() {
    try {
      await this.#viewEquipment();

      const idSelection = parseInt(prompt('Please type the id of the machine you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
      const needsMaintenanceInput = prompt("Does the machine need maintenance? Y/N: ").toLowerCase();
      let needsMaintenance;
      if (needsMaintenanceInput === "y") {
        needsMaintenance = 'true';
      } else if (needsMaintenanceInput === "n") {
        needsMaintenance = 'false';
      }
      let lastMaintained = prompt("When was the machine last maintained (yyyy-mm-dd)? ");

      if (!needsMaintenance || !lastMaintained) {
        const result = await this.client.query('SELECT * FROM Equipment WHERE id=$1', [idSelection]);
        const equipmentToChange = result?.rows[0];
        needsMaintenance = !needsMaintenance ? equipmentToChange.needs_maintenance : needsMaintenance;
        lastMaintained = !lastMaintained ? equipmentToChange.last_maintained : lastMaintained;
      }

      const updateQuery = `
        UPDATE Equipment
        SET needs_maintenance=$1, last_maintained=$2
        WHERE id=$3;
      `;

      await this.client.query(updateQuery, [needsMaintenance, lastMaintained, idSelection]);
      console.log("The machine has been updated successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #deleteEquipment() {
    try {
      await this.#viewEquipment();
      
      const idSelection = parseInt(prompt('Please type the id of the machine you want to delete: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }

      const deleteQuery = `
        DELETE FROM Equipment
        WHERE id=$1;
      `;

      await this.client.query(deleteQuery, [idSelection]);
      console.log("The machine has been deleted successfully.");
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }
}
module.exports = Admin;
