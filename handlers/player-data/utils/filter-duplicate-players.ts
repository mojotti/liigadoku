const playersToBeFiltered: string[] = [
  "c908575b-0e8a-5e89-b7d2-587bb004700f", // Kamil Kreps
  "759c1045-6830-59ec-8c58-ff282b6869cf", // Jakub Cutta
  "5a5296d0-b3a6-58f0-b84c-69ff63d4ad0e", // Travis Ehrhardt
  "11c8de1e-5379-5cbf-9b00-6b778b2b4eb9", // Justin Braun
  "2de346ca-f17b-56a8-a152-78705b0f6cf6", // Tomas Kudelka
  "a2843a42-d0ef-5c6a-9033-4048bf7a29fe", // Robert Petrovicky
  "26017bef-82f8-57bd-a275-e310e32e7722", // Alexander Ribbenstrand
  "de390e86-05cb-5b4d-b0da-6391caa917a0", // Tommy Wargh
];

export const filterDuplicatePlayers = <T extends { person: string }>(
  players: T[]
) => players.filter((p) => !playersToBeFiltered.includes(p.person));
