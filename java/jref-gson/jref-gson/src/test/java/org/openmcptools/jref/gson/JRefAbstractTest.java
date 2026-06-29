package org.openmcptools.jref.gson;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.regex.Pattern;

import org.junit.jupiter.api.AfterEach;
import org.openmcptools.jref.gson.JRefTypeAdapterFactory.JRefTypeAdapter;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class JRefAbstractTest {

	public static boolean TRACE = true;

	@AfterEach
	void clearThreadLocal() {
		JRefTypeAdapter.ptrToValue.remove();
		JRefTypeAdapter.readTSC.remove();
		JRefTypeAdapter.writeTSC.remove();
		JRefTypeAdapter.valueToPtr.remove();
	}

	public static GsonBuilder jsonMapperBuilder() {
		return new GsonBuilder();
	}

	protected Gson buildGsonJRef() {
		GsonBuilder builder = jsonMapperBuilder();
		builder.registerTypeAdapterFactory(new JRefTypeAdapterFactory());
		return builder.create();
	}

	protected Gson buildGsonNoJRef() {
		GsonBuilder builder = jsonMapperBuilder();
		return builder.create();
	}

	static long countMatches(String text, String target) {
		if (text == null || target == null || target.isEmpty())
			return 0;
		String quotedTarget = Pattern.quote(target);

		return Pattern.compile(quotedTarget).matcher(text).results().count();
	}

	protected void assertJRefCount(String input, long expectedJRefs) {
		assertEquals(expectedJRefs, countMatches(input, "$ref"));
	}

	void trace(String method, String s) {
		if (TRACE) {
			System.out.println(method + "." + s);
		}
	}
}
