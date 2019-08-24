import React from 'react'
import Header from './index'

import Adapter from 'enzyme-adapter-react-16'
import { shallow, configure} from 'enzyme'

configure({ adapter: new Adapter() })


describe('<Header />', () => {
    let wrapper

    beforeEach(() => {
        wrapper = shallow(<Header auth={{}} />)
    })

    it('should NOT render menu and structural unit if NOT authenticated', () => {
        wrapper.setProps({ auth: { loggedIn: false } })
        expect(wrapper.find('.app-menu')).toHaveLength(0)
        expect(wrapper.find('.structural-unit')).toHaveLength(0)
    })
    
    it('should render menu if authenticated', () => {
        wrapper.setProps({ auth: { loggedIn: true } })
        expect(wrapper.find('.app-menu')).toHaveLength(1)
    })

    it('should render structural unit if authenticated AND structural unit is given', () => {
        wrapper.setProps({ auth: { loggedIn: true, sturctulUnit: 'Факультет' } })
        expect(wrapper.find('.structural-unit')).toHaveLength(1)
    })
})