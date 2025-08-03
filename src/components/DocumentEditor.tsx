import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    IconButton,
    Typography,
    Button,
    Box,
    Tooltip,
} from '@mui/material';
import {
    Close,
    Save,
    Cancel,
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    StrikethroughS,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    FormatAlignJustify,
    Undo,
    Redo,
    AddPhotoAlternate,
    Link as LinkIcon,
    TableChart,
    Code,
    MoreVert,
    FormatIndentIncrease,
    FormatIndentDecrease,
    HorizontalRule,
    FormatClear,
} from '@mui/icons-material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';

interface DocumentEditorProps {
    open: boolean;
    onClose: (hasUnsavedChanges: boolean) => void;
    initialTitle?: string;
    initialContent?: string;
    onSave?: (content: string) => void;
}

const defaultContent = '<p>Start editing...</p>';

const lowlight = createLowlight();

// --- Editor Container Styles ---
const editorContainerStyle = {
    width: '100%',
    maxWidth: 800,
    bgcolor: '#fff',
    borderRadius: 2,
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

// --- Toolbar Styles ---
const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 2,
    py: 1,
    borderBottom: '1px solid #e0e0e0',
    bgcolor: '#f5f5f5',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    minHeight: 48,
};

const toolbarButtonStyle = {
    minWidth: 32,
    height: 32,
    borderRadius: 1,
    color: '#333',
    '&:hover': {
        bgcolor: '#e0e0e0',
    },
    '&.active': {
        bgcolor: '#1976d2',
        color: '#fff',
    },
};

const separatorStyle = {
    width: 1,
    height: 24,
    bgcolor: '#d0d0d0',
    mx: 1,
};

// --- Text Area Styles ---
const textAreaStyle = {
    minHeight: 300,
    px: 3,
    py: 2,
    '& .ProseMirror': {
        outline: 'none',
        fontSize: 16,
        lineHeight: 1.6,
        fontFamily: 'Inter, Roboto, Arial, sans-serif',
    },
    '& .ProseMirror p': {
        margin: '0.5em 0',
    },
};

export default function DocumentEditor({
    open,
    onClose,
    initialTitle = 'Edit Document',
    initialContent = defaultContent,
    onSave,
}: DocumentEditorProps) {
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            setUnsavedChanges(true);
        },
    });

    // Update editor content when initialContent changes
    useEffect(() => {
        if (editor && initialContent) {
            editor.commands.setContent(initialContent);
        }
    }, [initialContent, editor]);

    // Manual save
    const handleSave = useCallback(async () => {
        if (!editor) return;
        try {
            if (onSave) onSave(editor.getHTML());
            setUnsavedChanges(false);
            onClose(false);
        } catch (err: any) {
            alert(err.message || 'Failed to save document');
        }
    }, [editor, onSave, onClose]);

    // Cancel/Exit
    const handleClose = () => {
        if (unsavedChanges) {
            if (!window.confirm('You have unsaved changes. Exit without saving?')) return;
        }
        onClose(unsavedChanges);
    };

    // Toolbar actions
    const toolbarActions = [
        // Left Section - Editing Actions
        { icon: <Undo />, action: () => editor?.chain().focus().undo().run(), label: 'Undo' },
        { icon: <Redo />, action: () => editor?.chain().focus().redo().run(), label: 'Redo' },
        { type: 'separator' },
        { type: 'dropdown', label: 'Text Style', action: () => { } },
        { type: 'separator' },
        { icon: <FormatBold />, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold'), label: 'Bold' },
        { icon: <FormatItalic />, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic'), label: 'Italic' },
        { icon: <FormatUnderlined />, action: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive('underline'), label: 'Underline' },
        { icon: <StrikethroughS />, action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive('strike'), label: 'Strikethrough' },
        { type: 'separator' },
        { icon: <Code />, action: () => editor?.chain().focus().toggleCode().run(), active: editor?.isActive('code'), label: 'Inline Code' },
        { icon: <Code />, action: () => editor?.chain().focus().toggleCodeBlock().run(), active: editor?.isActive('codeBlock'), label: 'Code Block' },
        { type: 'separator' },
        { icon: <LinkIcon />, action: () => { }, label: 'Insert Link' },
        { icon: <LinkIcon />, action: () => { }, label: 'Remove Link' },
        { type: 'separator' },
        { icon: <FormatAlignLeft />, action: () => editor?.chain().focus().setTextAlign('left').run(), active: editor?.isActive({ textAlign: 'left' }), label: 'Align Left' },
        { icon: <FormatAlignCenter />, action: () => editor?.chain().focus().setTextAlign('center').run(), active: editor?.isActive({ textAlign: 'center' }), label: 'Align Center' },
        { icon: <FormatAlignRight />, action: () => editor?.chain().focus().setTextAlign('right').run(), active: editor?.isActive({ textAlign: 'right' }), label: 'Align Right' },
        { icon: <FormatAlignJustify />, action: () => editor?.chain().focus().setTextAlign('justify').run(), active: editor?.isActive({ textAlign: 'justify' }), label: 'Justify' },
        { type: 'separator' },
        { icon: <FormatListBulleted />, action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList'), label: 'Bullet List' },
        { icon: <FormatListNumbered />, action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive('orderedList'), label: 'Numbered List' },
        { type: 'separator' },
        { icon: <TableChart />, action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), label: 'Insert Table' },
        { icon: <HorizontalRule />, action: () => editor?.chain().focus().setHorizontalRule().run(), label: 'Horizontal Rule' },
        { icon: <FormatQuote />, action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive('blockquote'), label: 'Blockquote' },
        { icon: <FormatClear />, action: () => editor?.chain().focus().clearNodes().unsetAllMarks().run(), label: 'Clear Formatting' },
        { type: 'separator' },
        { icon: <MoreVert />, action: () => { }, label: 'More Options' },
    ];

    return (
        <Dialog
            open={open}
            fullScreen={isFullscreen}
            maxWidth={false}
            PaperProps={{
                style: {
                    minHeight: isFullscreen ? '100vh' : 'auto',
                    minWidth: isFullscreen ? '100vw' : 900,
                    maxWidth: isFullscreen ? '100vw' : 900,
                    margin: isFullscreen ? 0 : 16,
                }
            }}
        >
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Editor Container */}
                <Box sx={editorContainerStyle}>
                    {/* Toolbar */}
                    <Box sx={toolbarStyle}>
                        {toolbarActions.map((action, idx) => {
                            if (action.type === 'separator') {
                                return <Box key={idx} sx={separatorStyle} />;
                            }
                            if (action.type === 'dropdown') {
                                return (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}>
                                        <Typography variant="body2" sx={{ fontSize: 14 }}>{action.label}</Typography>
                                        <Box sx={{ ml: 0.5, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Box sx={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #666' }} />
                                        </Box>
                                    </Box>
                                );
                            }
                            if (action.type === 'color-picker') {
                                return (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}>
                                        <Box sx={{ width: 16, height: 16, bgcolor: '#000', borderRadius: 0.5 }} />
                                        <Box sx={{ ml: 0.5, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Box sx={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #666' }} />
                                        </Box>
                                    </Box>
                                );
                            }
                            return (
                                <Tooltip title={action.label} key={idx}>
                                    <IconButton
                                        onClick={action.action}
                                        sx={{
                                            ...toolbarButtonStyle,
                                            ...(action.active && { bgcolor: '#1976d2', color: '#fff' })
                                        }}
                                        size="small"
                                    >
                                        {action.icon}
                                    </IconButton>
                                </Tooltip>
                            );
                        })}
                    </Box>

                    {/* Text Area */}
                    <Box sx={textAreaStyle}>
                        <EditorContent editor={editor} />
                    </Box>
                </Box>

                {/* Action Buttons - Outside the editor box, bottom right */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3, width: '100%', maxWidth: 800 }}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        sx={{
                            borderColor: '#3CA1E8',
                            color: '#3CA1E8',
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#0095d5',
                                backgroundColor: 'rgba(60, 161, 232, 0.04)'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        sx={{
                            bgcolor: '#3CA1E8',
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#0095d5' }
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
} 