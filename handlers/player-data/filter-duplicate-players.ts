const playersToBeFiltered = [
  "0175a0b5-524d-5a1b-889b-7ce5219a6103", // Alexander Ribbenstrand, missed data with both profiles
  "0fffc178-14ff-5813-8580-ecf6078f7458", // Adam Berzins, no points with this profile
  "5ea8df3c-b2ab-5762-85e5-1d583c961643", // Ben Maxwell, has less points with this profile
  "cdce4c30-d37f-523d-83d4-b949bc786299", // Branislav Mezei, no stats with this profile
  "e88f7c8b-3fa9-5286-928c-d20e4590f56e", // Craig Smith, no stats with this profile
  "30f44099-3db4-50a8-bd15-250b588fa094", // Daniel Brodin, no stats with this profile
  "d9be4c2f-7b07-52dc-a056-7379899bd4ac", // Daniel Fernholm, no stats with this profile
  "4376e94b-623d-5060-81e1-4cea2f220c64", // Daniel Tjärnqvist, no stats with this profile
  "20b26f5b-a963-5d90-8366-c2c1f5bd8e22", // Daniel Dvoracek, no stats with this profile
  "a46af573-7bb4-50e9-8d37-5726257b60a4", // David Kveton, no stats with this profile
  "d676321b-c935-5843-9a35-7feff0403298", // Dennis Endras, no stats with this profile
  "2ab9e40e-eaf2-53d2-adfc-547333bc4980", // Ivan Majesky, no stats with this profile
  "5bc294be-0879-57f3-94ed-c741bec51920", // Jakub Cerny, no stats with this profile
  "ba35930a-8c89-5e55-ba46-b2d4e0cd2391", // Jakub Cutta, no stats with this profile
  "daef5192-e62f-5262-80b6-912a1da8132d", // Jan Hrdina, no stats with this profile
  "e348cf65-0b5e-5e0c-a85e-28c272692919", // Jan Lasak, no stats with this profile
  "24b0f966-f96d-5ba6-a5ca-ed798c5f6368", // Janis Sprukts, no stats with this profile
  "b9511e91-5755-5fa0-9091-e0ac468ebb5d", // Jari Jääskeläinen, no stats with this profile
  "1f77223c-72b7-517a-93f6-e8eb6c46c6c0", // Jari Tolsa, no stats with this profile
  "6e3f07af-65e0-5043-86b3-657585003e73", // Jens Westin, no stats with this profile
  "4a7d1ad8-308e-5dc5-bed9-a5eb976879c9", // Johan Backlund, no stats with this profile
  "e64400dd-d46c-5c3b-a897-f87f1391fbac", // Jonas Junland, no stats with this profile
  "d7697cbe-47aa-5691-a9db-032766339b80", // Jonathan Hedström, no stats with this profile
  "9987aa80-6335-5305-bc46-7bfb098eed19", // Joona Harjama, no stats with this profile
  "4f619aca-f6f7-5817-aae7-1c21f984ea16", // Juraj Mikus, no stats with this profile
  "01081988-98a8-5ef7-b041-f5e896a66ff8", // Kamil Kreps, no stats with this profile
  "ef90418f-6295-53aa-a16b-f77ca46c3ee1", // Kevin Shattenkirk, no stats with this profile
  "27fa05ca-b10c-542a-b19b-fed5bcdb3309", // Kris Russell, no stats with this profile
  "c417dc66-49fe-57ff-af35-d6131f80c145", // Kyle Turris, no stats with this profile
  "f6de7277-0cd2-5b12-8f00-5b2102bbd590", // Lars Eller, no stats with this profile
  "4d412537-c25c-56e4-8879-aef0f38cfe5b", // Marek Schwarz, no stats with this profile
  "859b8d60-f619-5be7-971e-d442600e5d63", // Marek Zidlicky, no stats with this profile
  "ae2b5b3b-844a-5b8b-a6c7-f045f7fa79d0", // Mario Scalzo, no stats with this profile
  "bc4f2b47-8fe5-5fdb-ad01-15be5a03bf30", // Michael Nylander, no stats with this profile
  "2ad80e4b-6957-56eb-a35e-c0b531db8a8c", // Mika Hannula, no stats with this profile
  "c225ec25-0466-5bef-9888-e43e779fab45", // Mikael Tellqvist, no stats with this profile
  "5e374858-5e9c-5bc6-a7da-443e6eeffdc6", // Milan Jurcina, no stats with this profile
  "8c9ffe93-cda8-5dfe-b488-0d2e477ce322", // Milan Kytnar, no stats with this profile
  "faa3c28f-505d-561a-802d-084d1c589b22", // Ondrej Pavelec, no stats with this profile
  "1cd26884-38c2-58d3-bbf3-71a279f50859", // Pasi Saarela, no stats with this profile
  "8eeb49cb-81da-512a-a9d5-2e0816ea5075", // Patrik Nevalainen, no stats with this profile
  "08512a16-468a-50ae-80de-6e8443378643", // Pavel Skrbek, no stats with this profile
  "e8b82ca1-189c-568c-8a2b-2c74fc771f41", // Per Johnsson, no stats with this profile
  "bc3703b2-1260-5eff-b09d-4eef0aab40e7", // Radek Philipp, no stats with this profile
  "579b1830-3bd6-54e3-a4dd-c3824613d155", // Rastislav Pavlikovsky, no stats with this profile
  "ad6aea34-12ae-54ad-9f13-093303953403", // Rich Peverley, no stats with this profile
  "3c6d9688-3544-5a6e-b77c-494929bc3c81", // Rodrigo Lavins, no stats with this profile
  "851ab348-9f75-5482-bf7b-1939dd6ea9a6", // Ryan Malone, no stats with this profile
  "93326537-5ba7-589a-80a7-83041b00f7b4", // Saku Koivu, no stats with this profile
  "7078a310-34d7-5396-a9f5-05618d72d6c5", // Sinuhe Wallinheimo, no stats with this profile
  "b8719503-3aa3-532e-8d32-074c7afc5e83", // Steve Moses, no stats with this profile
  "ce7f38ad-c03a-508f-8c2a-836924253926", // Timo Helbling, no stats with this profile
  "fcd081ff-56c4-55f6-8e3f-40f72598f5fa", // Tomas Kudelka, no stats with this profile
  "6a05e6f7-ff42-57bf-aad5-bca0794519cf", // Tomas Plihal, no stats with this profile
  "a4166efb-494e-5c99-a52d-0d7fb64994f5", // Tomas Vokoun, no stats with this profile
  "738d492c-5115-5331-be04-54ee0246f5e6", // Tommy Wargh, no stats with this profile
  "b8a18d05-b094-5d63-a9a0-6832c3e82cf6", // Travis Ehrhardt, no stats with this profile
  "da532802-0e3b-52e0-a75f-a11f913153ad", // Tyler Arnason, no stats with this profile
  "4651d1e6-e0e0-585b-a7c7-e23104cc5500", // Vladimir Dravecky, no stats with this profile
  "a339b054-88f9-5bd1-999e-e9902edae944", // Vladimir Eminger, no stats with this profile
];

export const filterDuplicatePlayers = <T extends { person: string }>(
  players: T[]
) => players.filter((p) => !playersToBeFiltered.includes(p.person));
