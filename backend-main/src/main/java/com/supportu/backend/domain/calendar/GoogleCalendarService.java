package com.supportu.backend.domain.calendar;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
public class GoogleCalendarService {

    private static final String APPLICATION_NAME = "SupportU";
    private static final String CALENDAR_ID = "primary";
    private static final ZoneId KOREA_ZONE_ID = ZoneId.of("Asia/Seoul");

    public GoogleCalendarResult createPolicyEvent(
            OAuth2AuthorizedClient authorizedClient,
            String title,
            String description,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
        try {
            Calendar calendar = createCalendarClient(authorizedClient);

            Event event = new Event()
                    .setSummary(title)
                    .setDescription(description)
                    .setStart(toEventDateTime(startAt))
                    .setEnd(toEventDateTime(endAt));

            Event createdEvent = calendar.events()
                    .insert(CALENDAR_ID, event)
                    .execute();

            return new GoogleCalendarResult(
                    createdEvent.getId(),
                    createdEvent.getHtmlLink()
            );
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalStateException("Google Calendar 이벤트 생성에 실패했습니다.", e);
        }
    }

    public void deleteEvent(
            OAuth2AuthorizedClient authorizedClient,
            String googleEventId
    ) {
        if (googleEventId == null || googleEventId.isBlank()) {
            return;
        }

        try {
            Calendar calendar = createCalendarClient(authorizedClient);
            calendar.events()
                    .delete(CALENDAR_ID, googleEventId)
                    .execute();
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalStateException("Google Calendar 이벤트 삭제에 실패했습니다.", e);
        }
    }

    private Calendar createCalendarClient(OAuth2AuthorizedClient authorizedClient)
            throws GeneralSecurityException, IOException {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();

        HttpRequestInitializer requestInitializer = request ->
                request.getHeaders().setAuthorization("Bearer " + accessToken);

        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer
        )
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    private EventDateTime toEventDateTime(LocalDateTime dateTime) {
        Date date = Date.from(dateTime.atZone(KOREA_ZONE_ID).toInstant());

        return new EventDateTime()
                .setDateTime(new com.google.api.client.util.DateTime(date))
                .setTimeZone(KOREA_ZONE_ID.toString());
    }

    public record GoogleCalendarResult(
            String googleEventId,
            String googleEventLink
    ) {
    }
}