"use client";
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Image from "next/image";
import { MagnifyingGlass as SearchIcon } from "@phosphor-icons/react/dist/ssr";
import CircularProgress from "@mui/material/CircularProgress";

const bodyParts = ["All", "waist", "chest", "back", "legs", "arms"];
const equipmentOptions = ["All", "body weight", "barbell", "dumbbell", "machine"];

export default function ExerciseLibraryTable({ exercises, onSelectExercise }: { exercises?: any[]; onSelectExercise?: (exercise: any) => void }) {
  const [search, setSearch] = React.useState("");
  const [bodyPart, setBodyPart] = React.useState("All");
  const [equipment, setEquipment] = React.useState("All");
  const [apiExercises, setApiExercises] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchExercises() {
      setLoading(true);
      setError(null);
      try {
        const params = [];
        if (bodyPart !== "All") params.push(`bodyPart=${encodeURIComponent(bodyPart)}`);
        if (equipment !== "All") params.push(`equipment=${encodeURIComponent(equipment)}`);
        if (search) params.push(`name=${encodeURIComponent(search)}`);
        const url = `https://exercisedb.p.rapidapi.com/exercises?${params.join("&")}`;
        const res = await fetch(url, {
          headers: {
            "X-RapidAPI-Key": "59e75cdb1fmshead49eb375543a2p1ec0b5jsneaeeffa9e399",
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com"
          }
        });
        if (!res.ok) throw new Error("Failed to fetch exercises from API");
        const data = await res.json();
        setApiExercises(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchExercises();
    // Only refetch when filters/search change
  }, [bodyPart, equipment, search]);

  const data = exercises || apiExercises;
  // Filter and search logic (API already filters, but fallback for mock)
  const filteredExercises = data.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesBodyPart = bodyPart === "All" || ex.bodyPart === bodyPart;
    const matchesEquipment = equipment === "All" || ex.equipment === equipment;
    return matchesSearch && matchesBodyPart && matchesEquipment;
  });

  return (
    <Paper elevation={3} sx={{ borderRadius: 4, boxShadow: 4, p: 3, mt: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search exercises"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="var(--icon-fontSize-md)" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="Body Part"
          value={bodyPart}
          onChange={(e) => setBodyPart(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {bodyParts.map((bp) => (
            <MenuItem key={bp} value={bp}>
              {bp.charAt(0).toUpperCase() + bp.slice(1)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {equipmentOptions.map((eq) => (
            <MenuItem key={eq} value={eq}>
              {eq.charAt(0).toUpperCase() + eq.slice(1)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {loading ? (
        <Stack alignItems="center" py={4}><CircularProgress /></Stack>
      ) : error ? (
        <Stack alignItems="center" py={4} color="error.main">{error}</Stack>
      ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Body Part</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Target Muscle</TableCell>
              {onSelectExercise && <TableCell align="right">Action</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExercises.map((ex) => (
              <TableRow key={ex.id || ex._id} hover>
                <TableCell>{ex.name}</TableCell>
                <TableCell>{ex.bodyPart}</TableCell>
                <TableCell>{ex.equipment}</TableCell>
                <TableCell>{ex.target}</TableCell>
                {onSelectExercise && (
                  <TableCell align="right">
                    <Button size="small" variant="contained" onClick={() => onSelectExercise(ex)}>
                      Add
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Paper>
  );
}
