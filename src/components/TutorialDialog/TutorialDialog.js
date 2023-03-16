import { LeftCircleFilled, RightCircleFilled } from '@ant-design/icons'
import { Button, Modal, Carousel, Select } from 'antd'
import React, {useState, useMemo} from 'react'
import { getAITutorial, getHSSSTutorial, getWFTutorial } from '../../ultilites/utilities'
import './TutorialDialog.less'

export function TutorialDialog({title = 'Tutorial Dialog', steps = []}) {
    const [ showDialog, setShowDialog ] = useState(false)
    const [ selected, setSelected ] = useState(null)
    const HSSTutorial = getHSSSTutorial()
    const AITutorial = getAITutorial()
    const WFTutorial = getWFTutorial()

    const resolvedSteps = useMemo(() => {
        if(steps.length) return steps

        if(selected === 'hsss') return HSSTutorial.steps
        if(selected === 'ai') return AITutorial.steps
        if(selected === 'wf') return WFTutorial.steps

        return []
    }, [AITutorial, HSSTutorial, WFTutorial, selected, steps])
    
    const resolvedTitle = useMemo(() => {

        if(title) return title

        if(selected === 'hsss') return HSSTutorial.title
        if(selected === 'ai') return AITutorial.title
        if(selected === 'wf') return WFTutorial.title

        return 'Tutorials'
    }, [AITutorial, HSSTutorial, WFTutorial, selected, title])

    return (
        <>
            <Button type='primary' onClick={() => setShowDialog(true)} >How to play</Button>
            <Modal
                title={resolvedTitle}
                open={showDialog}
                closable
                footer={null}
                onCancel={() => setShowDialog(false)}
                bodyStyle={{padding: '16px', paddingBottom: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}
            >
                <>
                    {!steps.length && (
                        <>
                            <Select
                                options={[
                                    {
                                        label: 'He Said She Said',
                                        value: 'hsss'
                                    },
                                    {
                                        label: 'Answer Is',
                                        value: 'ai'
                                    },
                                    {
                                        label: 'Word Fight',
                                        value: 'wf'
                                    }
                                ]}
                                value={selected}
                                onChange={setSelected}
                            ></Select>
                            <br />
                        </>
                    )}
                    <Carousel
                        dots={{className: 'tutorial-dots'}}
                        arrows={true}
                        prevArrow={<LeftCircleFilled />} 
                        nextArrow={<RightCircleFilled />}
                    >
                        {resolvedSteps.map((s, itr) => (
                            <div className='slide-container' >
                                {s.img && <img src={s.img} alt={`step-${itr+1}`} />}
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </Carousel>
                </>
            </Modal>
        </>
    )
}