import React, { useState } from "react";
import leagueService from "../../services/leagues.service";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { CircularProgress } from "@mui/material";

export default function LeaveLeague({ open, onClose, leagueId, leagueName, onLeagueLeft }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLeave = async () => {
        setLoading(true);
        setError("");

        try {
            await leagueService.leaveLeague(leagueId);
            onLeagueLeft();
            onClose();
        } catch (err) {
            console.error("Error leaving league:", err);
            setError(err.response?.data?.message || "Failed to leave the league. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} aria-labelledby="modal-title">
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 400,
                    bgcolor: "white",
                    boxShadow: 24,
                    p: 4,
                    borderRadius: "10px",
                    textAlign: "center"
                }}
            >
                <Typography id="modal-title" variant="h6" sx={{ mb: 2 }}>
                    ¿Estás seguro de que quieres salir de la liga "{leagueName}"?
                </Typography>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Box display="flex" justifyContent="space-between">
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleLeave}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : "Salir de la liga"}
                    </Button>
                    <Button variant="contained" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}