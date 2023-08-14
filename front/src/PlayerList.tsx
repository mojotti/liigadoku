import React from "react";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { PlayerShortVersion } from "../../types";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import Typography from "@mui/material/Typography";
import { CurrentGuess } from "./App";

function renderRow(
  props: ListChildComponentProps,
  onPlayerClick: (player: PlayerShortVersion) => void
) {
  const { index, style } = props;
  const item = props.data[index] as PlayerShortVersion;

  return (
    <ListItem style={style} key={index} component="div" disablePadding>
      <ListItemButton onClick={() => onPlayerClick(item)}>
        <ListItemText primary={item.name} secondary={item.dateOfBirth} />
      </ListItemButton>
    </ListItem>
  );
}

type Props = {
  allPlayers: PlayerShortVersion[];
  filteredPlayers: PlayerShortVersion[];
  onPlayerClick: (player: PlayerShortVersion) => void;
  onFilter: (filter: string) => void;
  currentGuess?: CurrentGuess;
};

export const PlayerList = React.forwardRef<HTMLDivElement, Props>(
  (
    { allPlayers, currentGuess, filteredPlayers, onFilter, onPlayerClick },
    ref
  ) => {
    const [searchText, setSearchText] = useState<string>("");

    const items =
      filteredPlayers.length === 0 && !searchText
        ? allPlayers
        : filteredPlayers;

    const hasNoHits = searchText.length > 0 && filteredPlayers.length === 0;

    return (
      <Box
        boxShadow={2}
        ref={ref}
        sx={{
          width: "100%",
          height: 450,
          maxWidth: 360,
          bgcolor: "background.paper",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "8px",
          "@media (max-width: 800px)": {
            top: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
          },
        }}
      >
        {currentGuess && (
          <>
            <Typography variant="h6" sx={{ padding: "1rem 1rem 0 1rem" }}>
              {currentGuess.teams.join(" ja ")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", padding: "0 1rem 0 1rem" }}
            >
              Vain Liiga-kaudet huomioidaan
            </Typography>
          </>
        )}
        <TextField
          id="outlined-basic"
          label="Hae pelaajaa"
          variant="outlined"
          value={searchText}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setSearchText(event.target.value);
            onFilter(event.target.value);
          }}
          sx={{
            width: "calc(100% - 1rem)",
            marginLeft: ".5rem",
            marginRight: ".5rem",
            marginTop: "16px",
            marginBottom: "16px",
            height: "50px",
          }}
        />
        {hasNoHits && (
          <Typography variant="body1" sx={{ padding: "1rem" }}>
            Ei hakutuloksia
          </Typography>
        )}
        {!hasNoHits && (
          <FixedSizeList
            itemData={items}
            height={300}
            width={360}
            itemSize={65}
            itemCount={items.length}
            overscanCount={5}
          >
            {(props) => renderRow(props, onPlayerClick)}
          </FixedSizeList>
        )}
      </Box>
    );
  }
);
