import { Player, PlayerShortVersion } from "../../../types";

export const handlePlayerName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/(^|[\s-])\S/g, (match) => match.toUpperCase());
};

const formatDateOfBirth = (dateOfBirth: string) => {
  const [year, month, day] = dateOfBirth.split("-");
  return `${day}.${month}.${year}`;
};

export const playerToShortVersion = (player: Player): PlayerShortVersion => {
  return {
    person: player.person,
    name: player.name,
    dateOfBirth: formatDateOfBirth(player.dateOfBirth),
  };
};

export const toPlayerName = (players: Player[]) =>
  players
    .sort((p1, p2) => {
      const p1Split = p1.name.split(" ");
      const p2Split = p2.name.split(" ");

      const firstName1 = p1Split[0];
      const lastName1 = p1Split[p1Split.length - 1];

      const firstName2 = p2Split[0];
      const lastName2 = p2Split[p2Split.length - 1];

      if (!lastName1 || !lastName2 || !firstName1 || !firstName2) {
        return 0;
      }

      if (lastName1 === lastName2) {
        return firstName1.localeCompare(firstName2);
      }

      return lastName1.localeCompare(lastName2);
    })
    .map(playerToShortVersion);
