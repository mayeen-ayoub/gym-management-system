CREATE TABLE Member (
    id          SERIAL          PRIMARY KEY,
    firstName   VARCHAR(255)    NOT NULL,
    lastName    VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    UNIQUE NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    phoneNumber VARCHAR(15),
    joinDate    DATE            DEFAULT CURRENT_DATE
);

CREATE TABLE Trainer (
    id          SERIAL          PRIMARY KEY,
    firstName   VARCHAR(255)    NOT NULL,
    lastName    VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    UNIQUE NOT NULL,
    password    VARCHAR(255)    NOT NULL
);

CREATE TABLE Admin (
    id          SERIAL          PRIMARY KEY,
    firstName   VARCHAR(255)    NOT NULL,
    lastName    VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    UNIQUE NOT NULL,
    password    VARCHAR(255)    NOT NULL
);

CREATE TABLE ExerciseRoutine (
    id      SERIAL          PRIMARY KEY,
    routine VARCHAR(255)    NOT NULL
);

CREATE TABLE RoomBooking (
    id          SERIAL          PRIMARY KEY,
    roomNumber  INT             NOT NULL,
    eventType   VARCHAR(255)    NOT NULL,
    date        DATE            NOT NULL,
    startTime   TIME            NOT NULL,
    endTime     TIME            NOT NULL
);

CREATE TABLE Equipment (
    id                  SERIAL      PRIMARY KEY,
    needsMaintenance    BOOLEAN     NOT NULL,
    lastMaintained      DATE        NOT NULL
);

CREATE TABLE FitnessGoal (
    id              SERIAL          PRIMARY KEY,
    memberId        INT,
    targetWeight    INT,
    targetTime      NUMERIC(3, 1),
    targetCalories  INT,
    FOREIGN KEY (memberId) 
        REFERENCES Member (id)
);

CREATE TABLE HealthMetrics (
    id              SERIAL          PRIMARY KEY,
    memberId        INT,
    weight          INT,
    heartRate       INT,
    caloriesBurned  INT,
    timeSpentAtGym  NUMERIC(3, 1),
    date            DATE            DEFAULT CURRENT_DATE,
    FOREIGN KEY (memberId) 
        REFERENCES Member (id)
);

CREATE TABLE Bill (
    id          SERIAL          PRIMARY KEY,
    memberId    INT,
    amount      NUMERIC(5, 2)   NOT NULL,
    feeType     VARCHAR(255)    NOT NULL,
    invoiceDate DATE            NOT NULL,
    paymentDate DATE,
    FOREIGN KEY (memberId) 
        REFERENCES Member (id)
);

CREATE TABLE Availability (
    id          SERIAL      PRIMARY KEY,
    trainerId   INT,
    dayOfWeek   VARCHAR(9)  NOT NULL,
    startTime   TIME        NOT NULL,
    endTime     TIME        NOT NULL,
    FOREIGN KEY (trainerId) 
        REFERENCES Trainer (id)
);

CREATE TABLE PersonalSession (
    id          SERIAL  PRIMARY KEY,
    memberId    INT,
    trainerId   INT,
    date        DATE    NOT NULL,
    startTime   TIME    NOT NULL,
    endTime     TIME    NOT NULL,
    FOREIGN KEY (memberId) 
        REFERENCES Member (id),
    FOREIGN KEY (trainerId) 
        REFERENCES Trainer (id)
);

CREATE TABLE PersonalSession_ExerciseRoutine (
    personalSessionId INT,
    exerciseRoutineId INT,
    FOREIGN KEY (personalSessionId) 
        REFERENCES PersonalSession (id),
    FOREIGN KEY (exerciseRoutineId) 
        REFERENCES ExerciseRoutine (id)
);

CREATE TABLE GroupSession (
    id              SERIAL          PRIMARY KEY,
    roomBookingId   INT,
    trainerId       INT,
    title           VARCHAR(255)    NOT NULL,
    FOREIGN KEY (roomBookingId) 
        REFERENCES RoomBooking (id),
    FOREIGN KEY (trainerId) 
        REFERENCES Trainer (id)
);

CREATE TABLE GroupSession_ExerciseRoutine (
    groupSessionId      INT,
    exerciseRoutineId   INT,
    FOREIGN KEY (groupSessionId) 
        REFERENCES GroupSession (id),
    FOREIGN KEY (exerciseRoutineId) 
        REFERENCES ExerciseRoutine (id)
);

CREATE TABLE Member_GroupSession (
    memberId        INT,
    groupSessionId  INT,
    FOREIGN KEY (memberId) 
        REFERENCES Member (id),
    FOREIGN KEY (groupSessionId) 
        REFERENCES GroupSession (id)
);
