import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useFlagVariation } from '@flopflip/react-broadcast';
import { useAuthentication } from '../contexts/AuthenticationContext';
import { useSpellbookUser } from '../contexts/SpellbookUserContext';

export function StartQuestionNPS() {
  const isNpsEnabled = useFlagVariation('startQuestionNpsSurvey');
  const { user } = useAuthentication();
  const { createdAt } = useSpellbookUser();

  const showSurvey = useCallback(() => {
    if (createdAt) {
      const userAge = Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / 1000 / 60 / 60 / 24,
      );
      return userAge > 30;
    }
    return false;
  }, [createdAt]);

  const userAttributes = user?.sub
    ? `
        Startquestion.call({
            type: "setAttributes",
            attributes: {
                email: "${user.email}",
                name: "${user.name}",
                user_sub: "${user.sub}",
                oid: "${user.id}",
            }
        });
    `
    : '';

  if (!isNpsEnabled || !showSurvey()) {
    return null;
  }

  return (
    <Helmet>
      <script type="text/javascript">
        {`
                        !function(e,t,n,o,a){var c=e.Startquestion=e.Startquestion||{};c.invoked?e.console&&console.warn&&console.warn("Startquestion snippet included twice."):(c.invoked=!0,c.queue=[],c.call=function(){c.queue.push(Array.prototype.slice.call(arguments))},(e=t.createElement("script")).type="text/javascript",e.async=!0,e.src=n,(t=t.getElementsByTagName("script")[0]).parentNode.insertBefore(e,t),c.call({type:"load",config:{key:o,lang:a}}))}(window,document,'https://library.startquestion.com/current/startquestion.js','8b4869d5-9cf1-4c6b-a1c9-cbb0e9769a3d','en');
                        ${userAttributes}
                        `}
      </script>
    </Helmet>
  );
}
