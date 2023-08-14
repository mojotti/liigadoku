import { LiigadokuOfTheDay } from "../../../types";
import { GameState, Score } from "../App";

const getIcon = (status: boolean) => (status ? "🟩" : "🟥");

export const formatScoreText = (
  gameState: GameState,
  score: Score,
  doku?: LiigadokuOfTheDay
) => {
  return `Liigadoku ${doku?.date}.
  
🏒🏒 Sain oikein ${score.correctAnswers}/${score.guesses}! 🎉🎉

${getIcon(gameState["0-0"].status)}${getIcon(gameState["1-0"].status)}${getIcon(
    gameState["2-0"].status
  )}  
${getIcon(gameState["0-1"].status)}${getIcon(gameState["1-1"].status)}${getIcon(
    gameState["2-1"].status
  )}  
${getIcon(gameState["0-2"].status)}${getIcon(gameState["1-2"].status)}${getIcon(
    gameState["2-2"].status
  )}

Käy kokeilemassa omia taitojasi: https://www.liigadoku.com`;
};
