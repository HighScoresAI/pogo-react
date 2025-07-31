import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField,
    Button,
    Box,
    Typography,
    Tooltip,
    RadioGroup,
    FormControlLabel,
    Radio,
    Chip,
    InputAdornment,
    Divider,
    List,
    ListItem,
    ListItemText,
    Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ROLE_OPTIONS = [
    {
        value: 'owner',
        label: 'Owner',
        tooltip: 'Full permissions: manage members, edit, delete, and configure project.'
    },
    {
        value: 'contributor',
        label: 'Contributor',
        tooltip: 'Can edit and add content, but cannot manage members or delete project.'
    },
    {
        value: 'viewer',
        label: 'Viewer',
        tooltip: 'Can only view content, no editing or management permissions.'
    },
];

interface MemberManagementModalProps {
    open: boolean;
    onClose: () => void;
    onSend?: (emails: string[], role: string, message: string) => Promise<{ emails: string[], links: string[] }>;
}

export default function MemberManagementModal({ open, onClose, onSend }: MemberManagementModalProps) {
    const [emails, setEmails] = useState<string[]>(['']);
    const [role, setRole] = useState('contributor');
    const [message, setMessage] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [invited, setInvited] = useState<string[]>([]);
    const [inviteLinks, setInviteLinks] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    const handleEmailChange = (idx: number, value: string) => {
        const arr = [...emails];
        arr[idx] = value;
        setEmails(arr);
    };
    const handleAddEmail = () => setEmails([...emails, '']);
    const handleRemoveEmail = (idx: number) => setEmails(emails.filter((_, i) => i !== idx));

    const handlePasteEmails = (idx: number, value: string) => {
        // Split by comma or newline
        const parts = value.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
        if (parts.length > 1) {
            setEmails([...emails.slice(0, idx), ...parts, ...emails.slice(idx + 1)]);
        } else {
            handleEmailChange(idx, value);
        }
    };

    const validateEmail = (email: string) =>
        /^\S+@\S+\.\S+$/.test(email);

    const handleSend = async () => {
        setError('');
        const allEmails = emails.map(e => e.trim()).filter(Boolean);
        if (!allEmails.length || allEmails.some(e => !validateEmail(e))) {
            setError('Please enter valid email addresses.');
            return;
        }
        setSending(true);
        try {
            let result = { emails: allEmails, links: allEmails.map(e => `https://invite.link/${encodeURIComponent(e)}`) };
            if (onSend) {
                result = await onSend(allEmails, role, message);
            }
            setInvited(result.emails);
            setInviteLinks(result.links);
            setShowConfirm(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send invitations.');
        } finally {
            setSending(false);
        }
    };

    const handleCopyLinks = () => {
        navigator.clipboard.writeText(inviteLinks.join('\n'));
        setCopied(true);
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        setCharCount(e.target.value.length);
    };

    const handleClose = () => {
        setShowConfirm(false);
        setEmails(['']);
        setRole('contributor');
        setMessage('');
        setCharCount(0);
        setError('');
        setInvited([]);
        setInviteLinks([]);
        setCopied(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, position: 'relative' }}>
                {showConfirm ? 'Invitations Sent' : 'Add Team Members'}
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {showConfirm ? (
                    <Box textAlign="center">
                        <Typography variant="h6" gutterBottom>Invitations sent successfully!</Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            The following emails have been invited:
                        </Typography>
                        <List>
                            {invited.map((email, idx) => (
                                <ListItem key={email}>
                                    <ListItemText primary={email} secondary={inviteLinks[idx]} />
                                </ListItem>
                            ))}
                        </List>
                        <Button
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopyLinks}
                            sx={{ mt: 2 }}
                        >
                            Copy Invitation Links
                        </Button>
                        <Button variant="contained" sx={{ mt: 2, ml: 2 }} onClick={handleClose}>
                            Done
                        </Button>
                        <Snackbar
                            open={copied}
                            autoHideDuration={2000}
                            onClose={() => setCopied(false)}
                            message="Copied!"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        />
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Enter email addresses to invite team members:
                        </Typography>
                        {emails.map((email, idx) => (
                            <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                                <TextField
                                    fullWidth
                                    label={idx === 0 ? 'Email address' : ''}
                                    value={email}
                                    onChange={e => handleEmailChange(idx, e.target.value)}
                                    onPaste={e => handlePasteEmails(idx, e.clipboardData.getData('text'))}
                                    error={!!email && !validateEmail(email)}
                                    helperText={!!email && !validateEmail(email) ? 'Invalid email' : ' '}
                                    size="small"
                                />
                                {emails.length > 1 && (
                                    <Button onClick={() => handleRemoveEmail(idx)} size="small" color="secondary">Remove</Button>
                                )}
                            </Box>
                        ))}
                        <Button onClick={handleAddEmail} size="small" sx={{ mb: 2 }}>Add another</Button>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Role:</Typography>
                        <RadioGroup row value={role} onChange={e => setRole(e.target.value)}>
                            {ROLE_OPTIONS.map(opt => (
                                <Tooltip key={opt.value} title={opt.tooltip} placement="top">
                                    <FormControlLabel
                                        value={opt.value}
                                        control={<Radio />}
                                        label={opt.label}
                                    />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Invitation Message (optional):</Typography>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={4}
                            value={message}
                            onChange={handleMessageChange}
                            inputProps={{ maxLength: 300 }}
                            helperText={`${charCount}/300 characters`}
                        />
                        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
                    </Box>
                )}
            </DialogContent>
            {!showConfirm && (
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSend} disabled={sending}>
                        {sending ? 'Sending...' : 'Send Invitations'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
} 