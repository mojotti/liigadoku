export const mapTeamName = (teamName: string) => {
  switch (teamName.toLowerCase()) {
    case "jyp ht":
      return "JYP";
    case "kiekko-reipas":
    case "kiekkoreipas":
    case "reipas":
    case "reipas lahti":
    case "hockey reipas":
    case "viipurin reipas":
      return "Pelicans";
    case "k-espoo":
      return "Blues";
    default:
      return teamName;
  }
};

const teamsIn2000s = [
  "Kärpät",
  "HIFK",
  "Tappara",
  "Pelicans",
  "KalPa",
  "JYP",
  "TPS",
  "Ässät",
  "HPK",
  "Lukko",
  "SaiPa",
  "Sport",
  "KooKoo",
  "Ilves",
  "Jukurit",
  "Blues",
  "Jokerit",
];

const formPairs = (arr: string[]): string[][] =>
  arr.map((v, i) => arr.slice(i + 1).map((w) => [v, w].sort())).flat();

export const getTeamsIn2000sPairs = () => formPairs(teamsIn2000s);
export const getTeamsIn2000s = () => teamsIn2000s;
