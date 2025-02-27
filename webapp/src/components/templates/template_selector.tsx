// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import styled from 'styled-components';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {getCurrentUser} from 'mattermost-webapp/packages/mattermost-redux/src/selectors/entities/common';

import {displayPlaybookCreateModal} from 'src/actions';
import {telemetryEventForTemplate, savePlaybook} from 'src/client';
import {StyledSelect} from 'src/components/backstage/styles';
import {selectTeamsIHavePermissionToMakePlaybooksOn} from 'src/selectors';
import {setPlaybookDefaults} from 'src/types/playbook';
import {navigateToPluginUrl} from 'src/browser_routing';

import TemplateItem from './template_item';
import PresetTemplates, {PresetTemplate} from './template_data';

const presetTemplateOptions = PresetTemplates.map((template: PresetTemplate) => ({label: template.title, value: template.title}));

interface Props {
    templates?: PresetTemplate[];
}

interface TemplateDropdownProps {
    template?: string
    onTemplateSet: (template?: string) => void
}

export const TemplateDropdown = (props: TemplateDropdownProps) => {
    const {formatMessage} = useIntl();

    const handleTemplateSet = (option: {value: string}) => {
        props.onTemplateSet(option.value);
    };

    return (
        <StyledSelect
            filterOption={null}
            isMulti={false}
            placeholder={formatMessage({defaultMessage: 'Select a template'})}
            onChange={handleTemplateSet}
            options={presetTemplateOptions}
            value={presetTemplateOptions.find((val) => val.value === props?.template)}
            isClearable={false}
            maxMenuHeight={380}
        />
    );
};

const SelectorGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: min(4vw, 5rem);
    place-items: flex-start center;
    padding: 0 0 100px;
`;

const instantCreatePlaybook = async (template: PresetTemplate, teamID: string, username: string): Promise<string> => {
    const pb = setPlaybookDefaults(template.template);
    pb.public = true;
    pb.team_id = teamID;
    if (username !== '') {
        pb.title = '@' + username + "'s " + template.title;
    }
    const data = await savePlaybook(pb);

    return data?.id;
};

const TemplateSelector = ({templates = PresetTemplates}: Props) => {
    const dispatch = useDispatch();
    const teams = useSelector(selectTeamsIHavePermissionToMakePlaybooksOn);
    const currentUser = useSelector(getCurrentUser);
    return (
        <SelectorGrid>
            {templates.map((template: PresetTemplate) => (
                <TemplateItem
                    key={template.title}
                    label={template.label}
                    title={template.title}
                    description={template.description ?? ''}
                    color={template.color}
                    icon={template.icon}
                    author={template.author}
                    labelColor={template.labelColor}
                    onSelect={async () => {
                        telemetryEventForTemplate(template.title, 'click_template_icon');
                        let username = currentUser.username;
                        const isTutorial = template.title === 'Learn how to use playbooks';
                        if (isTutorial) {
                            username = '';
                        }
                        if (isTutorial || teams.length === 1) {
                            const playbookID = await instantCreatePlaybook(template, teams[0].id, username);
                            navigateToPluginUrl(`/playbooks/${playbookID}`);
                        } else {
                            dispatch(displayPlaybookCreateModal({startingTemplate: template.title}));
                        }
                    }}
                />
            ))}

        </SelectorGrid>
    );
};

export default TemplateSelector;
