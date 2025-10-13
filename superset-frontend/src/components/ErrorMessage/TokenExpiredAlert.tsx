/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { t, styled } from '@superset-ui/core';
import Icons from 'src/components/Icons';

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.error.light2};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.colors.error.base};
  padding: ${({ theme }) => theme.gridUnit * 2}px;
  margin-bottom: ${({ theme }) => theme.gridUnit}px;
  width: 100%;
`;

const StyledContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const StyledTextContent = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${({ theme }) => theme.gridUnit * 2}px;
`;

const StyledTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.error.dark2};
  margin-bottom: ${({ theme }) => theme.gridUnit}px;
`;

const StyledBody = styled.span`
  color: ${({ theme }) => theme.colors.grayscale.base};
`;

interface TokenExpiredAlertProps {
  onReload?: () => void;
}

const TokenExpiredAlert: React.FC<TokenExpiredAlertProps> = ({ onReload }) => {
  const handleReload = () => {
    if (onReload) {
      onReload();
      return;
    }

    const isEmbedded = window.parent !== window;

    if (isEmbedded) {
      window.parent.postMessage(
        {
          type: 'SUPERSET_TOKEN_EXPIRED',
          action: 'RELOAD',
          timestamp: Date.now(),
          origin: window.location.origin,
        },
        '*',
      );
    } else {
      window.location.reload();
    }
  };

  return (
    <StyledContainer role="alert">
      <StyledContent>
        <Icons.AlertSolid iconColor="error" />
        <StyledTextContent>
          <StyledTitle>{t('Token de acesso expirado')}</StyledTitle>
          <StyledBody>
            {t('Sua sessão expirou. Clique no botão para renovar o acesso.')}
          </StyledBody>
        </StyledTextContent>
      </StyledContent>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={handleReload}
        size="small"
      >
        {t('Renovar')}
      </Button>
    </StyledContainer>
  );
};

export default TokenExpiredAlert;
