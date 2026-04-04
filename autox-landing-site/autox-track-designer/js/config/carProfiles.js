// Car drive profiles — edit this file to add or modify car profiles
// Each profile needs: id, name, acceleration, deceleration, maxSpeed, turnRate

const CAR_PROFILES = [
    { id: 'car1', name: 'Car 1', acceleration: 0.002, deceleration: 0.003, maxSpeed: 0.2, turnRate: 3 },
    { id: 'car2', name: 'Car 2', acceleration: 0.003, deceleration: 0.005, maxSpeed: 0.4, turnRate: 4 },
    { id: 'car3', name: 'Car 3', acceleration: 0.008, deceleration: 0.01,  maxSpeed: 0.8, turnRate: 4 },
];

window.CAR_PROFILES = CAR_PROFILES;
