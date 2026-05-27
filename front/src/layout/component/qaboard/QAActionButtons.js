import React from 'react';
import {
  Box,
  Button,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  AdminPanelSettings as AdminIcon,
  EditNote as EditNoteIcon
} from '@mui/icons-material';
import { getActionPermissions } from './qaPermissionUtils';

/* ── 공통 버튼 sx ── */
const outlinedGraySx = {
  borderRadius: '8px',
  borderColor: '#d1d5db',
  color: '#6b7280',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '13px',
  boxShadow: 'none',
  '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
};

const outlinedRedSx = {
  borderRadius: '8px',
  borderColor: '#fca5a5',
  color: '#DC2626',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '13px',
  boxShadow: 'none',
  '&:hover': { borderColor: '#DC2626', backgroundColor: '#fff1f1' },
};

const containedRedSx = {
  borderRadius: '8px',
  backgroundColor: '#DC2626',
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '13px',
  boxShadow: 'none',
  '&:hover': { backgroundColor: '#B91C1C', boxShadow: 'none' },
};

const QAActionButtons = ({
  item,
  isAdmin,
  isAuthor,
  onEdit,
  onDelete,
  onReply,
  onAdminEdit,
  onAdminDelete,
  onEditResponse,
  isExpanded,
  currentUserId
}) => {
  if (!isExpanded) return null;

  const permissions = getActionPermissions(item, isAdmin, currentUserId);

  console.log('QAActionButtons Debug:', {
    itemId: item.id,
    isAdmin,
    currentUserId,
    permissions
  });

  return (
    <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid #f3f4f6' }}>
      <Stack direction="row" spacing={1} justifyContent="flex-end">

        {/* 작성자 수정 */}
        {permissions.canEdit && (
          <Tooltip title="게시글 수정">
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon sx={{ fontSize: 15 }} />}
              onClick={() => onEdit(item.id)}
              sx={outlinedGraySx}
            >
              수정
            </Button>
          </Tooltip>
        )}

        {/* 작성자 삭제 */}
        {permissions.canDelete && (
          <Tooltip title="게시글 삭제">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
              onClick={() => onDelete(item.id)}
              sx={outlinedRedSx}
            >
              삭제
            </Button>
          </Tooltip>
        )}

        {/* 관리자 수정 */}
        {permissions.canEditAsAdmin && onAdminEdit && (
          <Tooltip title="관리자 권한으로 게시글 수정">
            <Button
              size="small"
              variant="outlined"
              startIcon={<AdminIcon sx={{ fontSize: 15 }} />}
              onClick={() => onAdminEdit(item.id)}
              sx={outlinedGraySx}
            >
              관리자 수정
            </Button>
          </Tooltip>
        )}

        {/* 관리자 삭제 */}
        {permissions.canDeleteAsAdmin && onAdminDelete && (
          <Tooltip title="관리자 권한으로 게시글 삭제">
            <Button
              size="small"
              variant="outlined"
              startIcon={<AdminIcon sx={{ fontSize: 15 }} />}
              onClick={() => onAdminDelete(item.id)}
              sx={outlinedRedSx}
            >
              관리자 삭제
            </Button>
          </Tooltip>
        )}

        {/* 답변 */}
        {permissions.canReply && (
          <Tooltip title="관리자 답변 작성">
            <Button
              size="small"
              variant="contained"
              startIcon={<ReplyIcon sx={{ fontSize: 15 }} />}
              onClick={() => onReply(item.id)}
              sx={containedRedSx}
            >
              답변
            </Button>
          </Tooltip>
        )}

        {/* 답변 수정 */}
        {permissions.canEditResponse && onEditResponse && (
          <Tooltip title="관리자 답변 수정">
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditNoteIcon sx={{ fontSize: 15 }} />}
              onClick={() => onEditResponse(item.id)}
              sx={outlinedGraySx}
            >
              답변 수정
            </Button>
          </Tooltip>
        )}

      </Stack>
    </Box>
  );
};

export default QAActionButtons;
