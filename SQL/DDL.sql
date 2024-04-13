-- This file creates the necessary tables and triggers for the app

CREATE TABLE Member (
  id           SERIAL          PRIMARY KEY,
  first_name   VARCHAR(255)    NOT NULL,
  last_name    VARCHAR(255)    NOT NULL,
  email        VARCHAR(255)    UNIQUE NOT NULL,
  password     VARCHAR(255)    NOT NULL,
  phone_number VARCHAR(15),
  join_date    DATE            DEFAULT CURRENT_DATE
);

CREATE TABLE Trainer (
  id          SERIAL          PRIMARY KEY,
  first_name  VARCHAR(255)    NOT NULL,
  last_name   VARCHAR(255)    NOT NULL,
  email       VARCHAR(255)    UNIQUE NOT NULL,
  password    VARCHAR(255)    NOT NULL
);

CREATE TABLE Admin (
  id          SERIAL          PRIMARY KEY,
  first_name  VARCHAR(255)    NOT NULL,
  last_name   VARCHAR(255)    NOT NULL,
  email       VARCHAR(255)    UNIQUE NOT NULL,
  password    VARCHAR(255)    NOT NULL
);

CREATE TABLE Exercise_Routine (
  id      SERIAL          PRIMARY KEY,
  routine VARCHAR(255)    NOT NULL
);

CREATE TABLE Room_Booking (
  id           SERIAL          PRIMARY KEY,
  room_number  INT             NOT NULL,
  event_type   VARCHAR(255)    NOT NULL,
  date         DATE            NOT NULL,
  start_time   TIME            NOT NULL,
  end_time     TIME            NOT NULL
);

CREATE TABLE Equipment (
  id                   SERIAL      PRIMARY KEY,
  needs_maintenance    BOOLEAN     NOT NULL,
  last_maintained      DATE        NOT NULL
);

CREATE TABLE Fitness_Goal (
  id               SERIAL          PRIMARY KEY,
  member_id        INT,
  target_weight    INT,
  target_time      NUMERIC(3, 1),
  target_calories  INT,
  FOREIGN KEY (member_id) 
    REFERENCES Member (id)
);

CREATE TABLE Health_Metrics (
  id                  SERIAL          PRIMARY KEY,
  member_id           INT,
  weight              INT,
  heart_rate          INT,
  calories_burned     INT,
  time_spent_at_gym   NUMERIC(3, 1),
  date                DATE            DEFAULT CURRENT_DATE,
  FOREIGN KEY (member_id) 
    REFERENCES Member (id)
);

CREATE TABLE Bill (
  id              SERIAL          PRIMARY KEY,
  member_id       INT,
  amount          NUMERIC(5, 2)   NOT NULL,
  fee_type        VARCHAR(255)    NOT NULL,
  invoice_date    DATE            NOT NULL,
  payment_date    DATE,
  FOREIGN KEY (member_id) 
    REFERENCES Member (id)
);

CREATE TABLE Availability (
  id              SERIAL      PRIMARY KEY,
  trainer_id      INT,
  day_of_week     VARCHAR(9)  NOT NULL,
  start_time      TIME        NOT NULL,
  end_time        TIME        NOT NULL,
  FOREIGN KEY (trainer_id) 
    REFERENCES Trainer (id)
);

CREATE TABLE Personal_Session (
  id           SERIAL  PRIMARY KEY,
  member_id    INT,
  trainer_id   INT,
  date         DATE    NOT NULL,
  start_time   TIME    NOT NULL,
  end_time     TIME    NOT NULL,
  FOREIGN KEY (member_id) 
    REFERENCES Member (id),
  FOREIGN KEY (trainer_id) 
    REFERENCES Trainer (id)
);

CREATE TABLE Personal_Session_Exercise_Routine (
  personal_session_id INT,
  exercise_routine_id INT,
  FOREIGN KEY (personal_session_id) 
    REFERENCES Personal_Session (id),
  FOREIGN KEY (exercise_routine_id) 
    REFERENCES Exercise_Routine (id),
  PRIMARY KEY (personal_session_id, exercise_routine_id)
);

CREATE TABLE Group_Session (
  id                SERIAL          PRIMARY KEY,
  room_booking_id   INT,
  trainer_id        INT,
  title             VARCHAR(255)    NOT NULL,
  FOREIGN KEY (room_booking_id) 
    REFERENCES Room_Booking (id),
  FOREIGN KEY (trainer_id) 
    REFERENCES Trainer (id)
);

CREATE TABLE Group_Session_Exercise_Routine (
  group_session_id      INT,
  exercise_routine_id   INT,
  FOREIGN KEY (group_session_id) 
    REFERENCES Group_Session (id),
  FOREIGN KEY (exercise_routine_id) 
    REFERENCES Exercise_Routine (id),
  PRIMARY KEY (group_session_id, exercise_routine_id)
);

CREATE TABLE Member_Group_Session (
  member_id        INT,
  group_session_id  INT,
  FOREIGN KEY (member_id) 
    REFERENCES Member (id),
  FOREIGN KEY (group_session_id) 
    REFERENCES Group_Session (id),
  PRIMARY KEY (member_id, group_session_id)
);

CREATE FUNCTION check_booking_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN
  IF NOT EXISTS (
    SELECT * FROM Room_Booking
    WHERE room_number = NEW.room_number AND date = NEW.date AND start_time <= NEW.end_time AND NEW.start_time <= end_time
  )
  THEN 
    RETURN NEW;
  ELSE 
    RAISE EXCEPTION 'Booking information conflicts with an existing room booking.';
  END IF;
END;
$$;

CREATE TRIGGER new_room_booking
  BEFORE INSERT OR UPDATE
  ON Room_Booking
  FOR EACH ROW
  EXECUTE PROCEDURE check_booking_conflicts();

CREATE VIEW health_statistics AS
  SELECT member_id, ROUND(AVG(heart_rate), 2) AS average_heart_rate, SUM(calories_burned) AS total_calories_burned, SUM(time_spent_at_gym) AS total_time_spent_at_gym, COUNT(date) AS num_gym_sessions
  FROM health_metrics
  GROUP BY member_id;

CREATE VIEW combined_routines_personal_session AS
  SELECT er.id, er.routine, ps_er.personal_session_id FROM Personal_Session_Exercise_Routine AS ps_er
  JOIN Exercise_Routine AS er ON er.id = ps_er.exercise_routine_id;

CREATE VIEW combined_routines_group_session AS
  SELECT er.id, er.routine, gs_er.group_session_id FROM Group_Session_Exercise_Routine AS gs_er
  JOIN Exercise_Routine AS er ON er.id = gs_er.exercise_routine_id;
