import React from "react";
import leagueService from "../../services/leagues.service";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function DeleteLeague({ open, onClose, leagueId, onLeagueDeleted }) {
    const handleDelete = async () => {
        try {
            await leagueService.deleteOneLeague(leagueId);
            onLeagueDeleted(); 
            onClose();
        } catch (error) {
            console.error("Error deleting league:", error);
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
                    ¿Estás seguro de que quieres eliminar esta liga?
                </Typography>
                <Box display="flex" justifyContent="space-between">
                    <Button variant="contained" color="error" onClick={handleDelete}>
                        Eliminar
                    </Button>
                    <Button variant="contained" onClick={onClose}>
                        Cancelar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
