import { LeftCircleFilled, RightCircleFilled } from '@ant-design/icons'
import { Button, Modal, Carousel } from 'antd'
import React, {useState} from 'react'
import './TutorialDialog.less'

export function TutorialDialog({title = 'Tutorial Dialog', steps = []}) {
    const [ showDialog, setShowDialog ] = useState(false)

    return (
        <>
            <Button type='primary' onClick={() => setShowDialog(true)} >How to play</Button>
            <Modal
                title={title}
                open={showDialog}
                closable
                footer={null}
                onCancel={() => setShowDialog(false)}
                bodyStyle={{padding: '16px', paddingBottom: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}
            >
                <Carousel
                    dots={{className: 'tutorial-dots'}}
                    arrows={true}
                    prevArrow={<LeftCircleFilled />} 
                    nextArrow={<RightCircleFilled />}
                >
                    {steps.map((s, itr) => (
                        <div className='slide-container' >
                            {s.img && <img src={s.img} alt={`step-${itr+1}`} />}
                            <p>{s.text}</p>
                        </div>
                    ))}
                </Carousel>
            </Modal>
        </>
    )
}