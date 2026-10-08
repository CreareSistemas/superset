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
import { styled, useTheme } from '@apache-superset/core/theme';
import { t } from '@apache-superset/core/translation';
import { Button, Icons } from '@superset-ui/core/components';

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colorErrorBg};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.colorErrorBorder};
  padding: ${({ theme }) => theme.sizeUnit * 2}px;
  margin-bottom: ${({ theme }) => theme.sizeUnit}px;
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
  margin-left: ${({ theme }) => theme.sizeUnit * 2}px;
`;

const StyledTitle = styled.span`
  font-weight: ${({ theme }) => theme.fontWeightStrong};
  color: ${({ theme }) => theme.colorErrorText};
  margin-bottom: ${({ theme }) => theme.sizeUnit}px;
`;

const StyledBody = styled.span`
  color: ${({ theme }) => theme.colorText};
`;

interface TokenExpiredAlertProps {
  onReload?: () => void;
}

const TokenExpiredAlert: React.FC<TokenExpiredAlertProps> = ({ onReload }) => {
  const theme = useTheme();

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
        <Icons.ExclamationCircleFilled iconColor={theme.colorError} iconSize="l" />
        <StyledTextContent>
          <StyledTitle>{t('Token de acesso expirado')}</StyledTitle>
          <StyledBody>
            {t('Sua sessão expirou. Clique no botão para renovar o acesso.')}
          </StyledBody>
        </StyledTextContent>
      </StyledContent>
      <Button buttonStyle="primary" buttonSize="small" onClick={handleReload}>
        <Icons.ReloadOutlined iconSize="s" />
        {t('Renovar')}
      </Button>
    </StyledContainer>
  );
};

export default TokenExpiredAlert;
