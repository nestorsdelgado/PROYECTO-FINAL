import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export default function BasicButtons({ label, onClick }) {
    return (
        <div className='button' style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px',
            padding: '20px'
        }}>
            <Stack spacing={2} direction="row">
                <Button variant="contained" onClick={onClick}> {label} </Button>
            </Stack>
        </div>

    );
}