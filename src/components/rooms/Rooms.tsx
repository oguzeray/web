import { ApolloError, gql, useMutation, useQuery } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import * as yup from "yup";

import { CreateNewRoomMutation, CreateNewRoomMutationVariables } from "../../__generated__/CreateNewRoomMutation";
import { RoomListQuery } from "../../__generated__/RoomListQuery";
import { RoomListSubscription } from "../../__generated__/RoomListSubscription";
import { notDraggable } from "../../library/mixin/mixin";
import Modal from "../../library/portals/Modal";
import { Button } from "../button/Button";
import { Card as CardOriginal } from "../card/Card";
import { NoRooms } from "../logo/NoRooms";

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const Card = styled(CardOriginal)`
    cursor: pointer;
`;

const Description = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 1rem 0rem;
    font-size: smaller;
    font-weight: 500;
    color: ${({ theme }) => theme.palette.primary[300]};
`;

const VerticallyCenterAlign = styled.div`
    margin-top: -3px;
    text-transform:capitalize;
`;

const ProfilePicture = styled.div`
    overflow: hidden;
    width: 2rem;
    height: 2rem;
    display: inline;
    img {
        border-radius: 50%;
        margin-left: -0.5rem;
        width: 2.3rem;
        height: 2.3rem;
        ${notDraggable}
    }
`;

const MemberCount = styled.div`
    font-weight: 700;
    color: ${({ theme }) => theme.palette.primary[100]};
`;

const Dot = styled.div`
        height: 10px;
        width: 10px;
        margin-left: 10px;
        margin-right: 10px;
        background-color: ${({ theme }) => theme.palette.accent.default};
        border-radius: 50%;
        display: inline-block;
`;

const ProfileContainer = styled.div`
    display: inline;
    margin-right: 5px;
    margin-left: 5px;
`;

const ROOM_LIST_QUERY = gql`
    query RoomListQuery {
        rooms {
            id
            name
            members {
                user {
                    id
                    avatar
                    username
                }
            }
        }
    }
`;

const ROOM_LIST_SUBSCRIPTION = gql`
    subscription RoomListSubscription {
        roomChange {
            event
            room_id
            room {
                id
                name
                members {
                    user {
                        id
                        avatar
                        username
                    }
                }
            }
        }
    }
`;

export const RoomListDataContainer: FC = () => {

    const { loading, data, error, subscribeToMore } = useQuery<RoomListQuery>(
        ROOM_LIST_QUERY,
        { fetchPolicy: "cache-first" }
    );

    return (
        <RoomList loading={loading} error={error} data={data}
            roomUpdates={() => subscribeToMore<RoomListSubscription>({
                onError: console.error,
                document: ROOM_LIST_SUBSCRIPTION, variables: {}, updateQuery: (previous, { subscriptionData }) => {
                    if (!subscriptionData) return previous;

                    if (subscriptionData.data.roomChange.event === "CREATE") {
                        return {
                            ...previous,
                            rooms: [...previous.rooms, subscriptionData.data.roomChange.room]
                        };
                    }

                    if (subscriptionData.data.roomChange.event === "DELETE") {
                        return {
                            ...previous,
                            rooms: previous.rooms.filter(room => room.id !== subscriptionData.data.roomChange.room.id)
                        };
                    }

                    if (subscriptionData.data.roomChange.event === "UPDATE") {
                        return {
                            ...previous,
                            rooms: previous.rooms.map(room => room.id === subscriptionData.data.roomChange.room.id ? subscriptionData.data.roomChange.room : room)
                        };
                    }
                    return previous;
                }
            })} />
    );
};

const Horizontal = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

type RoomListProperties = Readonly<{
    loading: boolean,
    error: ApolloError,
    data: RoomListQuery
    roomUpdates: () => () => void
}>

export const RoomList: FC<RoomListProperties> = ({ loading, error, data, roomUpdates }: RoomListProperties) => {

    const router = useRouter();

    useEffect(() => {
        roomUpdates();
    }, [roomUpdates]);

    if (loading) {
        return (<p>...Loading</p>);
    } else if (error) {
        return (<p>...Query Failed</p>);
    }

    if (data.rooms.length === 0) {
        return (
            <NoRooms />
        );
    }

    return (
        <Wrapper>
            {
                data.rooms.filter(room => room.members.length).map((room) => (
                    <Card padding key={room.id} onClick={() => {
                        router.push("/room/" + room.id);
                    }}>
                        <Horizontal>
                            {room.name}
                            <MemberCount>
                                <Dot />{room.members?.length || 0}
                            </MemberCount>
                        </Horizontal>
                        <Description>
                            <ProfileContainer>
                                {
                                    room.members.map((member) => (
                                        <ProfilePicture key={member.user.id}>
                                            <img srcSet={member.user.avatar} src={member.user.avatar} alt="Avatar" />
                                        </ProfilePicture>
                                    ))
                                }
                            </ProfileContainer>
                            <VerticallyCenterAlign>
                                {
                                    room.members.map((member) => (
                                        member.user.username + ", "
                                    ))
                                }
                            </VerticallyCenterAlign>
                        </Description>
                    </Card>
                ))
            }
        </Wrapper>
    );
};


/**
 * Header Content Stuff
 */

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 2rem 0;
`;

const Title = styled.div`
    padding: 0 0 0 2rem;
    font-size: 2rem;
    line-height: 3.1rem;
    font-weight: 700;
    padding-top: 0.8rem;
    color: ${({ theme }) => theme.palette.primary[100]};
`;

const RoomCreationWrapper = styled.div`
    position: relative;
    overflow: auto;
`;

const CloseButton = styled.span`
    padding: 1rem;
    border-radius: 0.5em;
    cursor: pointer;
    &:hover{
        padding: 1rem;
    }
`;

const SubTitle = styled.div`
    display: block;
    font-size: 1.2rem;
    line-height: 3.1rem;
    font-weight: 700;
    padding-top: 0.8rem;
    padding: 0 0 0 2rem;
    color: ${({ theme }) => theme.palette.primary[300]};
`;

const FormWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    input {
        margin: 1rem;
        width: 95%;
    }
    textarea {
        margin: 1rem;
        width: 95%;
    }
    p {
        text-align: center;
        color: ${({ theme }) => theme.palette.accent.default};
    }
`;

const FormHeader = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
`;

const RoomCreationMenuItem = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 1rem 1rem;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
`;

type RoomCreationFormValidationVals = Readonly<{
    name: string;
    description?: string;
}>;

const roomCreationFormValidationSchema = yup.object().shape({
    name: yup.string().min(3).max(60).required(),
    description: yup.string().max(500).optional(),
});

const CREATE_NEW_ROOM_MUTATION = gql`
    mutation CreateNewRoomMutation($name: String!, $description: String) {
        createRoom(name: $name, description: $description) {
            id
            name
        }
    }
`;

export const RoomCreationForm: FC = () => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = () => setExpanded(!expanded);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<RoomCreationFormValidationVals>({
        resolver: yupResolver(roomCreationFormValidationSchema)
    });

    const [createNewRoom, { loading, error }] = useMutation<CreateNewRoomMutation, CreateNewRoomMutationVariables>(CREATE_NEW_ROOM_MUTATION);

    const onSubmit = handleSubmit(async (data) => {
        setExpanded(false);
        const f = await createNewRoom({ variables: { name: data.name, description: data.description } });
        router.push("/room/" + f.data.createRoom.id);
    });

    if (loading) {
        return (<p>...Loading</p>);
    } else if (error) {
        return (<p>...Mutation Failed</p>);
    }

    const RoomForm = () => {
        return (
            <FormWrapper>
                <FormHeader>
                    <Row>
                        <div>
                            <Title>New room</Title>
                            <SubTitle>Fill the following fields to start a new room</SubTitle>
                        </div>
                        <CloseButton onClick={toggleExpanded} > X </CloseButton>
                    </Row>
                </FormHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <input placeholder="Room Name" {...register("name")} />
                    <p>{errors.name?.message}</p>
                    <textarea placeholder="Room Description" {...register("description")} />
                    <p>{errors.description?.message}</p>
                    <input type="Submit" />
                </form>
            </FormWrapper>
        );
    };

    return (
        <RoomCreationWrapper>
            <Button variant="ACCENT" onClick={toggleExpanded}>New room</Button>
            {expanded && (<Modal>
                <RoomCreationMenuItem>
                    <RoomForm />
                </RoomCreationMenuItem>
            </Modal>)}
        </RoomCreationWrapper>
    );
};

export const Rooms: FC = () => {
    return (
        <div>
            <Header>
                <Title>
                    Your feed
                </Title>
                <RoomCreationForm />
            </Header>
            <RoomListDataContainer />
        </div>
    );
};