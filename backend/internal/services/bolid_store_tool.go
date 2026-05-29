package services

import (
	"claraverse/internal/database"
	"claraverse/internal/tools"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	bolidDB      *database.MongoDB
	bolidDBOnce  sync.Once
)

func InitBolidStoreService(mongoDB *database.MongoDB) {
	bolidDBOnce.Do(func() {
		bolidDB = mongoDB
		log.Println("✅ [BOLID] Bolid store service initialized")
	})
}

func GetBolidDB() *database.MongoDB {
	return bolidDB
}

func NewStoreDeviceMetadataTool() *tools.Tool {
	return &tools.Tool{
		Name:        "store_device_metadata",
		DisplayName: "Store Device Metadata",
		Description: "Save or update structured metadata for a device (e.g., from NPO Bolid documentation) in MongoDB. Uses the device article as the unique key for upsert.",
		Icon:        "DatabaseBackup",
		Source:      tools.ToolSourceBuiltin,
		Category:    "data_sources",
		Keywords:    []string{"bolid", "device", "metadata", "store", "save", "catalog", "knowledge"},
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"article": map[string]interface{}{
					"type":        "string",
					"description": "Device article number (e.g., C2000-ASPT). Used as unique identifier.",
				},
				"device_name": map[string]interface{}{
					"type":        "string",
					"description": "Device name in Russian (e.g., PPKP Sirius)",
				},
				"device_type": map[string]interface{}{
					"type":        "string",
					"description": "Device type (e.g., PPKP, izveshatel, IBP, controller)",
				},
				"gost": map[string]interface{}{
					"type":        "string",
					"description": "GOST standard referenced in the documentation",
				},
				"protocols": map[string]interface{}{
					"type":        "array",
					"description": "List of communication protocols",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
				"specifications": map[string]interface{}{
					"type":        "object",
					"description": "Device specifications as key-value pairs (e.g., voltage, current, loops)",
				},
				"tags": map[string]interface{}{
					"type":        "array",
					"description": "Tags for categorization",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
			},
			"required": []string{"article", "device_name", "device_type"},
		},
		Execute: executeStoreDeviceMetadata,
	}
}

func executeStoreDeviceMetadata(args map[string]interface{}) (string, error) {
	db := GetBolidDB()
	if db == nil {
		return "", fmt.Errorf("bolid store service not initialized (MongoDB not configured)")
	}

	article, _ := args["article"].(string)
	if article == "" {
		return "", fmt.Errorf("article is required")
	}

	device := map[string]interface{}{
		"article":     article,
		"device_name": args["device_name"],
		"device_type": args["device_type"],
		"updated_at":  time.Now().UTC().Format(time.RFC3339),
	}

	if gost, ok := args["gost"].(string); ok && gost != "" {
		device["gost"] = gost
	}
	if protocols, ok := args["protocols"].([]interface{}); ok {
		device["protocols"] = protocols
	}
	if specs, ok := args["specifications"].(map[string]interface{}); ok {
		device["specifications"] = specs
	}
	if tags, ok := args["tags"].([]interface{}); ok {
		device["tags"] = tags
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := db.Database().Collection("bolid_devices")

	filter := bson.M{"article": article}
	update := bson.M{"$set": device}
	opts := options.Update().SetUpsert(true)

	updateResult, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return "", fmt.Errorf("failed to store device metadata: %w", err)
	}

	result, _ := json.Marshal(map[string]interface{}{
		"success":        true,
		"article":        article,
		"matched_count":  updateResult.MatchedCount,
		"modified_count": updateResult.ModifiedCount,
		"upserted":       updateResult.UpsertedID != nil,
	})

	log.Printf("✅ [BOLID] Stored device metadata: %s (matched=%d, modified=%d)",
		article, updateResult.MatchedCount, updateResult.ModifiedCount)
	return string(result), nil
}

func NewStoreProtocolSchemaTool() *tools.Tool {
	return &tools.Tool{
		Name:        "store_protocol_schema",
		DisplayName: "Store Protocol Schema",
		Description: "Save or update a parsed communication protocol schema (e.g., Orion RS-485) in MongoDB. Upserts by protocol_name.",
		Icon:        "Network",
		Source:      tools.ToolSourceBuiltin,
		Category:    "data_sources",
		Keywords:    []string{"bolid", "protocol", "schema", "store", "save", "rs485", "orion", "communication"},
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"protocol_name": map[string]interface{}{
					"type":        "string",
					"description": "Protocol name (e.g., Orion RS-485)",
				},
				"interface": map[string]interface{}{
					"type":        "string",
					"description": "Physical interface (e.g., RS-485, Ethernet, USB, CAN)",
				},
				"baud_rate": map[string]interface{}{
					"type":        "string",
					"description": "Supported baud rates (e.g., 9600, 19200, 57600, 115200)",
				},
				"packet_structure": map[string]interface{}{
					"type":        "object",
					"description": "Packet structure description with byte positions and field names",
				},
				"commands": map[string]interface{}{
					"type":        "array",
					"description": "List of protocol commands with codes and descriptions",
					"items": map[string]interface{}{
						"type": "object",
					},
				},
				"addresses": map[string]interface{}{
					"type":        "string",
					"description": "Address range description",
				},
				"error_codes": map[string]interface{}{
					"type":        "object",
					"description": "Error codes map",
				},
				"examples": map[string]interface{}{
					"type":        "array",
					"description": "Example hex packets",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
				"sources": map[string]interface{}{
					"type":        "array",
					"description": "Source document names",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
			},
			"required": []string{"protocol_name"},
		},
		Execute: executeStoreProtocolSchema,
	}
}

func executeStoreProtocolSchema(args map[string]interface{}) (string, error) {
	db := GetBolidDB()
	if db == nil {
		return "", fmt.Errorf("bolid store service not initialized (MongoDB not configured)")
	}

	protocolName, _ := args["protocol_name"].(string)
	if protocolName == "" {
		return "", fmt.Errorf("protocol_name is required")
	}

	protocol := map[string]interface{}{
		"protocol_name": protocolName,
		"updated_at":    time.Now().UTC().Format(time.RFC3339),
	}

	if iface, ok := args["interface"].(string); ok && iface != "" {
		protocol["interface"] = iface
	}
	if baudRate, ok := args["baud_rate"].(string); ok && baudRate != "" {
		protocol["baud_rate"] = baudRate
	}
	if packetStruct, ok := args["packet_structure"].(map[string]interface{}); ok {
		protocol["packet_structure"] = packetStruct
	}
	if commands, ok := args["commands"].([]interface{}); ok {
		protocol["commands"] = commands
	}
	if addresses, ok := args["addresses"].(string); ok && addresses != "" {
		protocol["addresses"] = addresses
	}
	if errorCodes, ok := args["error_codes"].(map[string]interface{}); ok {
		protocol["error_codes"] = errorCodes
	}
	if examples, ok := args["examples"].([]interface{}); ok {
		protocol["examples"] = examples
	}
	if sources, ok := args["sources"].([]interface{}); ok {
		protocol["sources"] = sources
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := db.Database().Collection("bolid_protocols")

	filter := bson.M{"protocol_name": protocolName}
	update := bson.M{"$set": protocol}
	opts := options.Update().SetUpsert(true)

	updateResult, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return "", fmt.Errorf("failed to store protocol schema: %w", err)
	}

	result, _ := json.Marshal(map[string]interface{}{
		"success":        true,
		"protocol_name":  protocolName,
		"matched_count":  updateResult.MatchedCount,
		"modified_count": updateResult.ModifiedCount,
		"upserted":       updateResult.UpsertedID != nil,
	})

	log.Printf("✅ [BOLID] Stored protocol schema: %s (matched=%d, modified=%d)",
		protocolName, updateResult.MatchedCount, updateResult.ModifiedCount)
	return string(result), nil
}
