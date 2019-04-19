import React from 'react'
import SessionCompleteWindow from './index'

import Adapter from 'enzyme-adapter-react-16'
import { shallow, configure, mount } from 'enzyme'
import Dialog from '@material-ui/core/Dialog'
import { act } from 'react-dom/test-utils';

configure({ adapter: new Adapter() })

describe('<SessionCompleteWindow />', () => {
    let wrapper

    beforeEach(() => {
        jest.useFakeTimers()
        wrapper = mount(<SessionCompleteWindow onSessionEnd={() => { }} studentName="" />)
    })

    it('should disappear after 3s', () => {
        expect(wrapper.find(Dialog).prop('open')).toBeTruthy()
        act(() => {
            jest.advanceTimersByTime(3 * 1000)
        })
        wrapper.update()
        expect(wrapper.find(Dialog).prop('open')).toBeFalsy()
    })
})