const prompt = require('prompt-sync')();
const TableDisplay = require('./tableDisplay.js');

class Trainer {	
  constructor(client) {
    this.client = client;
    this.tableDisplay = new TableDisplay();
  }

  /* PUBLIC FUNCTIONS */
  async scheduleManagement() {
    const trainerId = await this.#checkIfTrainer();
    if (trainerId !== null) {
      console.log('How do you want modify your availabilities?');
      console.log('1. Add a new availability');
      console.log('2. Update a current availability');
      console.log('3. Delete an availability');
      console.log('4. View availabilities');
      const selection = parseInt(prompt('Type the corresponding number to make a selection: '));
      
      switch (selection) {
        case 1:
          await this.#addNewAvailability(trainerId);
          break;
        case 2:
          await this.#updateAvailability(trainerId);
          break;
        case 3:
          await this.#deleteAvailability(trainerId)
          break;
        default:
          await this.#viewAvailabilities(trainerId);
      }
    }
  }

  async viewMemberProfile() {
    try {
      if (await this.#checkIfTrainer() !== null) {
        const firstName = prompt("What is the first name of the member? ");
        const lastName = prompt("What is the last name of the member? ");
        const query = 'SELECT id, first_name, last_name, email, phone_number, join_date FROM Member WHERE first_name = $1 AND last_name = $2;';
        const result = await this.client.query(query, [firstName, lastName]);
        
        if (result.rowCount === 0) {
          console.log("There are no members with that name");
          return;
        }
        const headers = ['id', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Join Date'];
        this.tableDisplay.printResultsAsTable(result, headers, true, 'join_date');
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  /* PRIVATE FUNCTIONS */
  async #checkIfTrainer() {
    try {
      const email = prompt("Enter trainer email: ");
      const password = prompt("Enter password: ");
      const dbPasswordResult = await this.client.query('SELECT id, password FROM Trainer WHERE email = $1;', [email]);
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

  async #insertAvailability(trainerId, weekday) {
    const startTime = prompt('When can you start? (eg. type 1:30 for 1:30am and 13:30 for 1:30pm) ');
    const endTime = prompt('What hour can you end? (eg. type 1:30 for 1:30am and 13:30 for 1:30pm) ');

    const insertQuery = `
      INSERT INTO Availability (trainer_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4);
    `;
    
    await this.client.query(insertQuery, [trainerId, weekday.toLowerCase(), startTime, endTime]);
  }

  async #addNewAvailability(trainerId) {
    try {
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      for (let weekday of weekdays) {
        const workingResponse = prompt(`Are you free on ${weekday}? (Y/N)`).toLowerCase();
        if (workingResponse === "y") {
          await this.#insertAvailability(trainerId, weekday);
          let anotherAvailablity; 
          do {
            anotherAvailablity = prompt(`Are you available another time on ${weekday}? (Y/N) `).toLowerCase();
            if (anotherAvailablity === "y") {
              await this.#insertAvailability(trainerId, weekday);
            }
          } while (anotherAvailablity === "y")
        }
      }
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #updateAvailability(trainerId) {
    try {
      await this.#viewAvailabilities(trainerId);

      const idSelection = parseInt(prompt('Please type the id of the availibility you want to modify: '));
      if (!idSelection) {
        console.log("No valid id was entered. Terminating request...");
        return;
      }
      
      console.log('***Make any changes when prompted. If nothing is entered, nothing will change for that field.');
      let weekDay = prompt("What day of the week should this be changed to? No shorthands (eg. Monday instead of Mon) ").toLowerCase();
      let startTime = prompt("When do you want to start your shift? (eg. 1:00 for 1am, 13:00 for 1pm) ");
      let endTime = prompt("When do you want to end your shift? (eg. 1:00 for 1am, 13:00 for 1pm) ");

      if (!weekDay || !startTime || !endTime) {
        const result = await this.client.query('SELECT * FROM availability WHERE id=$1', [idSelection]);
        const availabilityToChange = result?.rows[0];
        weekDay = !weekDay ? availabilityToChange.day_of_week : weekDay;
        startTime = !startTime ? availabilityToChange.start_time : startTime;
        endTime = !endTime ? availabilityToChange.end_time : endTime;
      }

      const updateQuery = `
        UPDATE availability
        SET day_of_week=$1, start_time=$2, end_time=$3
        WHERE id=$4;
      `;

      await this.client.query(updateQuery, [weekDay, startTime, endTime, idSelection]);

    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }


  async #deleteAvailability(trainerId) {
    try {
      await this.#viewAvailabilities(trainerId);
      
      const idSelection = parseInt(prompt('Please type the id of the availibility you want to delete: '));

      const deleteQuery = `
        DELETE FROM availability
        WHERE id=$1;
      `;

      await this.client.query(deleteQuery, [idSelection]);

    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }

  async #viewAvailabilities(trainerId) {
    try {
      const allAvailabilities = await this.client.query('SELECT id, day_of_week, start_time, end_time FROM Availability WHERE trainer_id=$1;', [trainerId]);
      const headers = ['id', 'Day of the Week', 'Start Time', 'End Time'];
      this.tableDisplay.printResultsAsTable(allAvailabilities, headers);
    } catch(error) {
      console.log(`ERROR: ${error.message}\n`);
      return;
    }
  }
}
module.exports = Trainer;
