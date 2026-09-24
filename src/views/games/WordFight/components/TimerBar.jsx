import { Progress } from 'antd'

// Blue while there is plenty of time, yellow as it runs low, red at the end.
const barColor = percent => {
    if (percent > 50) return '#177ddc'
    if (percent > 30) return '#fff44fbb'

    return '#ff0000bb'
}

export default function TimerBar({ percent }) {
    return (
        <Progress
            percent={percent}
            showInfo={false}
            strokeLinecap="square"
            strokeColor={barColor(percent)}
            railColor="#434343"
        />
    )
}
