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
        wrapper = mount(<SessionCompleteWindow open={false} onSessionEnd={() => { }} studentName="" />)
    })

    it('should open when `open` prop changes to true', () => {
        wrapper.setProps({ open: true })
        expect(wrapper.find(Dialog).prop('open')).toBeTruthy()
    })

    it('should be closed when `open` prop is false', () => {
        wrapper.setProps({ open: false })
        expect(wrapper.find(Dialog).prop('open')).toBeFalsy()
    })
})