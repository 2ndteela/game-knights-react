import { CheckOutlined } from '@ant-design/icons'

// Rows are returned without a wrapper: the styles lay them out as children of
// the screen's .main-container, and an extra div would be flexed into a column.
//
// Banding keys off each player's position in the game rather than in this list,
// so the stripes stay put as people drop in and out of it.
export default function PlayerCheckList({ players }) {
    return players.map(p => (
        <div className={p.idx % 2 === 1 ? 'player-and-check striped' : 'player-and-check'} key={p.idx} >
            <div>{p.name}</div>
            {p.timeStamp && <div className="check-mark" ><CheckOutlined /></div>}
        </div>
    ))
}
