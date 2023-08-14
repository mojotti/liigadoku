import React from "react";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import HelpIcon from "@mui/icons-material/HelpOutline";
import TwitterIcon from "@mui/icons-material/Twitter";
import { LiigadokuOfTheDay } from "../../../types";

const helpTexts = [
  "Tervetuloa pelaamaan Liigadokua!",
  "Pelissä on tarkoituksena löytää ruutuun pelaaja, joka on pelannut molemmissa ruudun joukkueissa.",
  "Joka päivä on tarjolla uusi peli ja uudet joukkueet.",
  "Pelin jälkeen voit tutkia tilastoja sekä jakaa tuloksesi ja haastaa kaverisi peliin.",
  "Huom! Liigadokussa huomioidaan vain joukkueen Liiga-kaudet. Esim. Jukureiden Mestis-ajan pelaajat eivät kelpaa vastaukseksi.",
];

export const Header = ({
  dokuOfTheDay,
}: {
  dokuOfTheDay?: LiigadokuOfTheDay;
}) => {
  const [isHelpOpen, setHelpOpen] = React.useState(false);

  return (
    <>
      <Modal open={isHelpOpen} onClose={() => setHelpOpen(false)}>
        <Paper
          sx={{
            position: "absolute",
            top: "4rem",
            right: "2rem",
            height: "auto",
            maxWidth: "300px",
          }}
        >
          <Stack padding={"1rem"} rowGap={"1rem"}>
            {helpTexts.map((text) => (
              <Typography key={text} variant="body2">
                {text}
              </Typography>
            ))}
          </Stack>
        </Paper>
      </Modal>
      <Stack
        direction="row"
        justifyContent="space-between"
        width="100%"
        alignItems="flex-start"
        p="1rem 0"
      >
        <Stack direction="column" alignItems="flex-start">
          <h1 className="header">Liigadoku</h1>
          <Typography variant="body1" mb="0.5rem">
            {dokuOfTheDay?.date}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center">
          <Link
            href="https://twitter.com/liigadoku"
            target="_blank"
            sx={{
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            <TwitterIcon sx={{ color: "#fffffff3" }} fontSize="large" />
          </Link>

          <IconButton
            onClick={() => setHelpOpen(true)}
            sx={{
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            <HelpIcon sx={{ color: "#fffffff3" }} fontSize="large" />
          </IconButton>
        </Stack>
      </Stack>
    </>
  );
};
