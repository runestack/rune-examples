package io.runestack.examples.notes;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("note")
public record Note(@Id Long id, String text, Instant createdAt) {
}
