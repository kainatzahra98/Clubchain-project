import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MobileContainer from '../../components/Mobile/MobileContainer';
import Home from './Home';
import Explore from './Explore';
import ClubDetails from './ClubDetails';
import Alerts from './Alerts';
import Profile from './Profile';
import Feedback from './Feedback';
import IntroLetterRequest from './IntroLetterRequest';
import MyLetters from './MyLetters';
import MyMemberships from './MyMemberships';
import Events from './Events';
import AccountSettings from './AccountSettings';
import Payments from './Payments';
import PrivacySecurity from './PrivacySecurity';
import HelpCenter from './HelpCenter';

const ClientApp = () => {
    return (
        <MobileContainer role="client">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/clubs/:id" element={<ClubDetails />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/intro-letter-request" element={<IntroLetterRequest />} />
                <Route path="/my-letters" element={<MyLetters />} />
                <Route path="/my-memberships" element={<MyMemberships />} />
                <Route path="/events" element={<Events />} />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/privacy-security" element={<PrivacySecurity />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </MobileContainer>
    );
};

export default ClientApp;
