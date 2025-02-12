package com.moviebuff.moviebuff_backend.dto.response;

import lombok.Data;
import java.util.*;
// AnalyticsResponse.java
@Data
public class AnalyticsResponse {
   private Map<String, Double> occupancyRates;
   private Map<String, Double> revenue;
   private Map<String, Long> showCounts;
   private Map<String, Integer> ticketsSold;
   private Map<String, Object> customerStats;
}