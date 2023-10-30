export const getStagePrefix = (stageRef: string) => {
  if (stageRef === "prod") {
    return "";
  }
  return `${stageRef}-`;
};

export const getName = (stageRef: string, name: string) => {
  const stagePrefix = getStagePrefix(stageRef);
  return `${stagePrefix}${name}`;
};


export const milestoneKeys = [
  "400points",
  "600games",
  "300assists",
  "500penaltyMinutes",
  "200goals",
  "200plusMinus",
  "50pointsSeason",
  "60pointsSeason",
  "40assistsSeason",
  "35assistsSeason",
  "30assistsSeason",
  "100penaltyMinutesSeason",
  "150penaltyMinutesSeason",
  "30goalsSeason",
  "25goalsSeason",
  "20goalsSeason",
  "5Teams",
  "6Teams",
  "7Teams",
  "8Teams",
  "10Seasons",
  "12Seasons",
  "14Seasons",
  "15Seasons",
];

export const getRandomMilestone = () =>
  milestoneKeys[Math.floor(Math.random() * milestoneKeys.length)];
