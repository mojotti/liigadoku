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
