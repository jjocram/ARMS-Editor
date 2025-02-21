import {Button, Loader, Modal, Text, VStack} from "rsuite";
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';

interface LoadingSimulationProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    status: "loading" | "error" | "success";
    errorMessage: string;
}

export default function LoadingSimulationModal({isOpen, setIsOpen, status, errorMessage}: LoadingSimulationProps) {
    const closeModal = () => setIsOpen(false);

    return (
        <Modal backdrop="static" role="alertdialog" open={isOpen} size="xs">
            <Modal.Header closeButton={false}>
                {status === "loading" && <Modal.Title>Running the simulation</Modal.Title>}
                {status === "success" && <Modal.Title>Simulation complete</Modal.Title>}
                {status === "error" && <Modal.Title>Something went wrong</Modal.Title>}
            </Modal.Header>
            <Modal.Body style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                {status === "loading" &&
                    <Loader content="Running the simulation" vertical center style={{height: "2em"}}/>}
                {status === "success" && <CheckRoundIcon color="green" style={{fontSize: "2em"}}/>}
                {status === "error" && (
                    <VStack alignItems="center">
                        <WarningRoundIcon color="red" style={{fontSize: "2em"}}/>
                        <Text>{errorMessage}</Text>
                    </VStack>
                )}
            </Modal.Body>
            {status === "error" && (
                <Modal.Footer>
                    <Button onClick={closeModal} appearance="primary">
                        Ok
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
}