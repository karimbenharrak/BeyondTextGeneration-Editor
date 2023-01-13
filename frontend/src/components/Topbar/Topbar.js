import React, {useState} from 'react';
import {FileEarmarkTextFill} from "react-bootstrap-icons";

import './Topbar.css';
import {Badge, Button, Modal} from "react-bootstrap";

function Topbar(props) {

    const documentName = props.documentName || "Demo Text Document";
    const description = props.description || "This document exists for demonstration purposes.";
    const infoModalTitle = props.infoModalTitle;
    const infoModalText = props.infoModalText;
    const saveButton = props.saveButton || null;

    const [showModal, setShowModal] = useState(false);

    let infoModal = null;
    if (infoModalText) {
        infoModal = <Modal size="lg" show={showModal} onHide={() => {setShowModal(false)}}>
            <Modal.Header closeButton>
                <Modal.Title>{infoModalTitle || "Information"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div dangerouslySetInnerHTML={{ __html: infoModalText }} />
            </Modal.Body>
        </Modal>
    }

    const modalTrigger = <Button size="sm" variant="secondary" onClick={() => {setShowModal(true)}}>Show {infoModalTitle || "Information"}</Button>


    return (
        <div className={"topbar"}>
            <div className={"topbar-left"}>
                <div className={"document-icon"}>
                    <FileEarmarkTextFill color="royalblue" size={40} />
                </div>
                <div className={"inner"}>
                    <h1>{documentName} {saveButton}</h1>
                    <p className={"description"}>{description}</p>
                </div>
            </div>
            <div className={"topbar-right"}>
            </div>
            {infoModal}
        </div>
    );
}

export default Topbar;
